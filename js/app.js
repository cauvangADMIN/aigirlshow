/* ================= DOM ================= */

const slider = document.getElementById("slider");
const tabs = document.querySelectorAll(".tab");
const guide = document.getElementById("scrollGuide");
const btnUp = document.getElementById("btnUp");
const btnDown = document.getElementById("btnDown");
const memeBox = document.querySelector(".meme-box");

/* ================= CONFIG ================= */

const BATCH_SIZE = 8;
const MAX_DOM_SLIDES = 30;
const JSON_PATH = "data/video.json";

/* ================= STATE ================= */

let allData = {};
let currentTab = "anime";

function createEmptyState() {
    return {
        memes: [],
        currentIndex: 0,
        loadedCount: 0,
        pendingNextBatch: null,
        initialized: false
    };
}

const tabState = {
    anime: createEmptyState(),
    nsfw: createEmptyState()
};

let loadMoreBtn = null;
let loadMoreClickCount = 0;

/* ================= LOAD MORE ADS MAP ================= */

const loadMoreAdMap = {
    1: "https://shorterwanderer.com/qv394jzf?key=1e88e85568f404ad029fc7a4e3db685f",
    2: "https://shorterwanderer.com/d91f7rhz?key=6da6633dca4cad3f743f1633b8b5da53",
    4: "https://shorterwanderer.com/zmw6nnbnh?key=5f6e16e896ed5dfefee6515585b5ee03",
    6: "https://shorterwanderer.com/v358mgkvej?key=9b130202fbcda0879599843d16bd7577",
    10: "https://shorterwanderer.com/xmjpt9bm?key=7fed831526b5ff86aa9eb8d43f01e0c8"
};

/* ================= UTIL ================= */

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

/* ================= FETCH JSON ================= */

async function loadData() {
    const res = await fetch(JSON_PATH);
    allData = await res.json();
}

/* ================= LOAD TAB ================= */

function loadTab(tabName) {

    const state = tabState[tabName];

    // Lần đầu vào tab
    if (!state.initialized) {
        state.memes = [...(allData[tabName] || [])];
        shuffleArray(state.memes);
        state.initialized = true;
    }

    currentTab = tabName;

    slider.innerHTML = "";

    renderBatch(state.loadedCount);

    updateSlider();

    if (guide) guide.style.display = tabName === "anime" ? "block" : "none";
}

/* ================= LOAD MORE BUTTON ================= */

function createLoadMoreButton() {

    if (loadMoreBtn) return;

    loadMoreBtn = document.createElement("button");
    loadMoreBtn.innerText = "Load More";
    loadMoreBtn.className = "load-more-btn";
    loadMoreBtn.style.display = "none";

    loadMoreBtn.addEventListener("click", () => {

        const state = tabState[currentTab];

        loadMoreClickCount++;

        if (loadMoreAdMap[loadMoreClickCount]) {
            window.open(loadMoreAdMap[loadMoreClickCount], "_blank");
        }

        if (state.pendingNextBatch !== null) {
            renderBatch(state.pendingNextBatch);
            state.pendingNextBatch = null;
            hideLoadMoreButton();
        }
    });

    memeBox.appendChild(loadMoreBtn);
}

function showLoadMoreButton() {
    createLoadMoreButton();
    loadMoreBtn.style.display = "block";
}

function hideLoadMoreButton() {
    if (loadMoreBtn) loadMoreBtn.style.display = "none";
}

/* ================= RENDER ================= */

function renderBatch(startIndex) {

    const state = tabState[currentTab];

    const batch = state.memes.slice(startIndex, startIndex + BATCH_SIZE);

    batch.forEach(url => {
        slider.appendChild(createSlide(url));
    });

    state.loadedCount = startIndex;

    trimDOM();
}

/* ================= CREATE SLIDE ================= */

function createSlide(url) {

    const slide = document.createElement("div");
    slide.className = "slide";

    const video = document.createElement("video");
    video.src = url;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "metadata";

    slide.appendChild(video);
    return slide;
}

/* ================= VIDEO CONTROL ================= */

function handleVideoPlayback() {

    const state = tabState[currentTab];

    Array.from(slider.children).forEach((slide, index) => {

        const video = slide.querySelector("video");
        if (!video) return;

        if (index === state.currentIndex) {
            video.play().catch(() => {});
            preloadNearby(index);
        } else {
            video.pause();
        }
    });
}

/* ================= PRELOAD NEXT ================= */

function preloadNearby(index) {

    const preloadIndexes = [index + 1, index + 2];

    preloadIndexes.forEach(i => {
        const slide = slider.children[i];
        if (!slide) return;

        const video = slide.querySelector("video");
        if (video && video.preload !== "auto") {
            video.preload = "auto";
        }
    });
}

/* ================= SLIDER ================= */

function updateSlider() {

    const state = tabState[currentTab];

    slider.style.transition = "transform 0.35s ease-out";
    slider.style.transform = `translateY(-${state.currentIndex * 100}%)`;

    handleVideoPlayback();
}

/* ================= DOM LIMIT ================= */

function trimDOM() {

    const state = tabState[currentTab];

    while (slider.children.length > MAX_DOM_SLIDES) {
        slider.removeChild(slider.firstChild);
        state.currentIndex--;
        if (state.currentIndex < 0) state.currentIndex = 0;
    }
}

/* ================= NAVIGATION ================= */

function nextSlide() {

    const state = tabState[currentTab];

    if (state.currentIndex < slider.children.length - 1) {
        state.currentIndex++;
        updateSlider();
        return;
    }

    const nextBatchStart = state.loadedCount + BATCH_SIZE;

    if (nextBatchStart < state.memes.length) {
        state.pendingNextBatch = nextBatchStart;
        showLoadMoreButton();
    }
}

function prevSlide() {

    const state = tabState[currentTab];

    if (state.currentIndex > 0) {
        state.currentIndex--;
        updateSlider();
    }
}

/* ================= TOUCH ================= */

let startY = 0;
let deltaY = 0;

slider.addEventListener("touchstart", e => {
    startY = e.touches[0].clientY;
});

slider.addEventListener("touchend", e => {

    deltaY = e.changedTouches[0].clientY - startY;

    if (deltaY < -80) nextSlide();
    if (deltaY > 80) prevSlide();
});

/* ================= DESKTOP MOUSE ================= */

slider.addEventListener("mousedown", e => {
    startY = e.clientY;
});

slider.addEventListener("mouseup", e => {

    deltaY = e.clientY - startY;

    if (deltaY < -80) nextSlide();
    if (deltaY > 80) prevSlide();
});

/* ================= TABS ================= */

tabs.forEach(tab => {

    tab.addEventListener("click", () => {

        if (tab.dataset.tab === currentTab) return;

        tabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");

        loadTab(tab.dataset.tab);
    });
});

/* ================= INIT ================= */

(async function init() {
    await loadData();
    createLoadMoreButton();
    loadTab(currentTab);
})();

/* ================= DESKTOP BUTTONS ================= */

if (btnUp && btnDown) {
    btnUp.addEventListener("click", prevSlide);
    btnDown.addEventListener("click", nextSlide);
}
