const songListElement = document.getElementById('song-list');
const lyricsContent = document.getElementById('lyrics-content');
const welcomeMessage = document.getElementById('welcome-message');
const displayTitle = document.getElementById('display-title');
const displayArtist = document.getElementById('display-artist');
const lyricsText = document.getElementById('lyrics-text');
const searchInput = document.getElementById('search-input');

// 설정 모달 관련 DOM
const toggleFurigana = document.getElementById('toggle-furigana');
const togglePron = document.getElementById('toggle-pron');
const toggleKo = document.getElementById('toggle-ko');
const settingsModal = document.getElementById('SettingsModal');
const settingsBtn = document.getElementById('SettingsBtn');
const closeSettingsBtn = document.getElementById('CloseSettingsBtn');
const closeSortMenuBtn = document.getElementById('CloseSortMenuBtn');
const sortBtn = document.getElementById("sortBtn");
const sortMenu = document.getElementById("SortMenu");

// 사이드바 관련 DOM
const hamburgerBtn = document.getElementById('HamburgerBtn');
const sidebar = document.getElementById('Sidebar');
const sidebarOverlay = document.getElementById('SidebarOverlay');
const noticeModal = document.getElementById('NoticeModal');
const mobileCloseBtn = document.getElementById('MobileCloseBtn');

let allSongs = [];
let nowSongs = [];

let sortType = localStorage.getItem("lyrics_bokaro_sort_type") ?? "title"; // ( title | artist | latest | oldest )

// 모달창 열기/닫기 이벤트
settingsBtn?.addEventListener('click', () => settingsModal.classList.remove('hidden'));
closeSettingsBtn?.addEventListener('click', () => settingsModal.classList.add('hidden'));
closeSortMenuBtn?.addEventListener('click', () => sortMenu.classList.add("hidden"));

// 모바일 사이드바 열기/닫기 이벤트
function toggleSidebar(show) {
    if (show) {
        sidebar.classList.add('open');
        sidebarOverlay.classList.remove('hidden');
    } else {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.add('hidden');
    }
}
hamburgerBtn?.addEventListener('click', () => toggleSidebar(true));
mobileCloseBtn?.addEventListener('click', () => toggleSidebar(false));
sidebarOverlay?.addEventListener('click', () => toggleSidebar(false));

// 버전을 비교하는 함수
function compareVersion(a, b) {
    const va = a.split(".").map(Number);
    const vb = b.split(".").map(Number);

    for (let i = 0; i < 3; i++) {
        if (va[i] !== vb[i]) {
            return va[i] - vb[i];
        }
    }

    return 0;
}

// 최신 버전 공지를 보여주는 함수
async function showNotice() {
    const notice = await fetch("notice.json")
            .then(res => res.json());

    const lastest = notice.reduce((latest, current) => {
        return compareVersion(current.version, latest.version) > 0
            ? current
            : latest;
    });

    const lastVersion = localStorage.getItem("lyrics_bokaro_last_version");
    if (!lastVersion ||
    compareVersion(lastest.version, lastVersion) > 0) {
        console.log(lastest);
        noticeModal.innerHTML = `<div class="modal-content"><div class="modal-header" style="display: flex; flex-dircetion: column;"><h1>${lastest.title}</h1><small>Update at ${lastest.date}</small></div><div class="modal-section">${lastest.changes.replaceAll(" ", "&nbsp;")}</div><button id="noticeCloseButton" style="width: 100px; height: 30px; margin-top: 10px; background-color: #d00; color: #fff; border: none; border-radius: 5px;">확인</button></div>`;
        document.getElementById("noticeCloseButton")?.addEventListener('click', closeNotice);
        noticeModal.style.flexDirection = "column";
        noticeModal.classList.remove('hidden');

        localStorage.setItem(
            "lyrics_bokaro_last_version",
            lastest.version
        );
    }
}

function closeNotice() {
    noticeModal.classList.add('hidden');
}

// 가사 표시 옵션 업데이트 함수
function updateVisibility() {
    const rtElements = document.querySelectorAll('rt');
    const pronElements = document.querySelectorAll('.lyric-pron');
    const koElements = document.querySelectorAll('.lyric-ko');

    if (toggleFurigana) rtElements.forEach(el => el.style.display = toggleFurigana.checked ? '' : 'none');
    if (togglePron) pronElements.forEach(el => el.style.display = togglePron.checked ? '' : 'none');
    if (toggleKo) koElements.forEach(el => el.style.display = toggleKo.checked ? '' : 'none');
}

// 토글 버튼에 이벤트 리스너 연결
toggleFurigana?.addEventListener('change', updateVisibility);
togglePron?.addEventListener('change', updateVisibility);
toggleKo?.addEventListener('change', updateVisibility);


// JSON 데이터 로드
async function loadSongs() {
    try {
        const response = await fetch('songs.json');
        if (!response.ok) throw new Error('데이터 로드 실패');
        
        allSongs = await response.json();
        nowSongs = allSongs;
        renderListWithSorts();

        const urlParams = new URLSearchParams(window.location.search);
        const songId = urlParams.get('id');

        if (songId) {
            const matchedSong = allSongs.find(song => song.id === songId);
            if (matchedSong) showLyrics(matchedSong);
        }
    } catch (error) {
        console.error('Error:', error);
        if (songListElement) songListElement.innerHTML = '<li>목록을 불러올 수 없습니다.</li>';
    }
}

// 리스트 렌더링
function renderList(songs) {
    if (!songListElement) return;
    songListElement.innerHTML = '';

    if (songs.length === 0) {
        songListElement.innerHTML = '<li style="text-align:center; color:#999; pointer-events:none;">검색 결과 없음</li>';
        return;
    }

    songs = sortSongs(songs);

    songs.forEach(song => {
        const li = document.createElement('li');
        li.className = song.singer ? `singer-${song.singer}` : "";
        li.innerHTML = `<strong>${song.title}</strong><br><small>${song.artist}</small>`;
        
        li.addEventListener('click', () => {
            if (song.id) {
                const newUrl = `${window.location.pathname}?id=${song.id}`;
                window.history.pushState({ path: newUrl }, '', newUrl);
            }
            showLyrics(song);
            
            // 모바일 환경일 경우 곡 선택 시 사이드바 자동 닫기
            if (window.innerWidth <= 1052) toggleSidebar(false);
        });
        
        songListElement.appendChild(li);
    });
}

// 가사 및 영상 표시
function showLyrics(song) {
    welcomeMessage?.classList.add('hidden');
    lyricsContent?.classList.remove('hidden');

    if (displayTitle) displayTitle.innerText = song.title;
    if (displayArtist) displayArtist.innerText = song.artist;

    if (lyricsText && song.lyrics) {
        if (Array.isArray(song.lyrics) && typeof song.lyrics[0] === 'object') {
            const lyricsHtml = song.lyrics.map(line => {
                const currentSinger = line.singer || song.singer;
                const singerClass = currentSinger ? `singer-${currentSinger}` : '';

                return `
                <div class="lyric-line ${singerClass}" style="margin-bottom: 20px;">
                    <div class="lyric-ja" style="font-size: 1.1em;">${line.ja || ""}</div>
                    <div class="lyric-pron" style="font-size: 0.9em; margin-top: 4px;">${line.pronunciation || ""}</div>
                    <div class="lyric-ko" style="font-size: 1em; margin-top: 2px;">${line.ko || ""}</div>
                </div>
                `;
            }).join('');

            lyricsText.innerHTML = lyricsHtml;
            updateVisibility();
        } else if (typeof song.lyrics === 'string') {
            lyricsText.innerHTML = song.lyrics.replace(/\n/g, '<br>');
        } else {
            lyricsText.innerHTML = "데이터 형식을 확인할 수 없습니다.";
        }
    }

    // 영상 처리
    const videoContainer = document.getElementById('video-container');
    const videoFrame = document.getElementById('video-frame');
    const videoLink = document.getElementById('video-link');

    if (song.videoUrl && song.videoUrl.trim() !== "") {
        videoFrame.src = song.videoUrl;
        videoLink.href = song.Url || song.videoUrl;
        videoContainer?.classList.remove('hidden');
    } else {
        videoFrame.src = "";
        videoLink.href = "";
        videoContainer?.classList.add('hidden');
    }

    document.querySelector('.lyrics-scroll-body')?.scrollTo({ top: 0, behavior: 'smooth' });
}

// 곡을 정렬하는 함수
function sortSongs(songs, Type = sortType) {
    const sorted = [...songs];

    switch (Type) {
        case "title":
            sorted.sort((a, b) =>
                a.title.localeCompare(b.title, "ja")
            );
            break;

        case "artist":
            sorted.sort((a, b) =>
                a.artist.localeCompare(b.artist, "en")
            );
            break;

        case "latest":
            sorted.sort((a, b) =>
                new Date(b.add_at) - new Date(a.add_at)
            );
            break;

        case "oldest":
            sorted.sort((a, b) =>
                new Date(a.add_at) - new Date(b.add_at)
            );
            break;
    }

    return sorted;
}

// 정렬한 후 로딩하는 함수
function renderListWithSorts(Type = sortType) {
    sortType = Type;
    localStorage.setItem("lyrics_bokaro_sort_type", Type);
    renderList(sortSongs(nowSongs, Type));
    sortMenu?.classList.add('hidden');
}

sortBtn.addEventListener("click", () => sortMenu.classList.remove('hidden'));

// 검색 기능
searchInput?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    const filteredSongs = allSongs.filter(song =>
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query) ||
        (song.krTitle && song.krTitle.toLowerCase().includes(query)) ||
        (song.krArtist && song.krArtist.toLowerCase().includes(query))
    );
    nowSongs = filteredSongs;
    renderListWithSorts();
});

// 초기화
showNotice();
loadSongs();