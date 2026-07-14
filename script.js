const songListElement = document.getElementById('song-list');
const lyricsContent = document.getElementById('lyrics-content');
const welcomeMessage = document.getElementById('welcome-message');
const displayTitle = document.getElementById('display-title');
const displayArtist = document.getElementById('display-artist');
const lyricsText = document.getElementById('lyrics-text');
const searchInput = document.getElementById('search-input');

const toggleFurigana = document.getElementById('toggle-furigana');
const togglePron = document.getElementById('toggle-pron');
const toggleKo = document.getElementById('toggle-ko');

// 상태 변수
let MSidebar = 1;

let allSongs = [];
const videoWrapper = document.createElement('div');
videoWrapper.id = 'video-container';
videoWrapper.className = 'hidden';
videoWrapper.innerHTML = `
    <iframe id="video-frame" 
            src="" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen>
    </iframe>
    <a id="video-link" class="mobile-video-link" href="" target="_blank">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="vertical-align: text-bottom; margin-right: 6px;"><path d="M21.582 6.186a2.6 2.6 0 0 0-1.838-1.838C18.125 3.9 12 3.9 12 3.9s-6.125 0-7.744.448a2.6 2.6 0 0 0-1.838 1.838C2 7.805 2 12 2 12s0 4.195.448 5.814a2.6 2.6 0 0 0 1.838 1.838C5.875 20.1 12 20.1 12 20.1s6.125 0 7.744-.448a2.6 2.6 0 0 0 1.838-1.838C22 16.195 22 12 22 12s0-4.195-.418-5.814zM9.99 15.47V8.53L16 12l-6.01 3.47z"/></svg>
        YouTube 영상 보러가기
    </a>

    <div id="singer-legend" style="user-select: none;">
        <p style="margin-bottom: 8px; font-weight: bold; color: #333;">🎤 파트별 색상 안내</p>
        <div style="display: flex; flex-direction: column; gap: 5px; font-family: 'Kosugi Maru', sans-serif;">
            <span style="color: #F00; font-weight: bold;">■ 카사네 테토</span>
            <span style="color: #FA0; font-weight: bold;">■ 카가미네 린</span>
            <span style="color: #DD0; font-weight: bold;">■ 카가미네 렌</span>
            <span style="color: #AA0; font-weight: bold;">■ 아키타 네루</span>
            <span style="color: #899b35; font-weight: bold;">■ 즌다몬</span>
            <span style="color: #25cac7; font-weight: bold;">■ 하츠네 미쿠</span>
            <span style="color: #FFC0CB; font-weight: bold;">■ 메구리네 루카</span>
        </div>
    </div>
`;

// 가사 영역 상단이나 container 내부에 삽입
document.querySelector('.lyrics-view')?.prepend(videoWrapper);


// 가사 요소 표시 상태 업데이트 함수
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


// 1. JSON 파일에서 데이터 가져오기 및 URL 파라미터 체크
async function loadSongs() {
    try {
        const response = await fetch('songs.json');
        if (!response.ok) {
            throw new Error('데이터를 불러오는 데 실패했습니다.');
        }
        allSongs = await response.json();
        renderList(allSongs);

        // [추가] URL에서 id 파라미터를 분석하여 자동으로 곡을 띄워주는 로직
        const urlParams = new URLSearchParams(window.location.search);
        const songId = urlParams.get('id');

        if (songId) {
            // JSON 데이터 중 id가 일치하는 곡을 검색 (예: song.id 혹은 song.key 값 매칭)
            const matchedSong = allSongs.find(song => song.id === songId);
            if (matchedSong) {
                showLyrics(matchedSong);
            }
        }

    } catch (error) {
        console.error('Error:', error);
        if (songListElement) {
            songListElement.innerHTML = '<li>노래 목록을 불러올 수 없습니다.</li>';
        }
    }
}

// 2. 리스트 렌더링 함수
function renderList(songs) {
    if (!songListElement) return;
    songListElement.innerHTML = '';

    if (songs.length === 0) {
        songListElement.innerHTML = '<li style="text-align:center; color:#999; font-size:0.9rem; pointer-events:none;">검색 결과가 없습니다.</li>';
        return;
    }

    songs.forEach(song => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${song.title}</strong><br><small>${song.artist}</small>`;
        li.addEventListener('click', () => {
            // [추가] 리스트에서 곡을 직접 클릭했을 때도 URL의 쿼리 스트링을 업데이트 (새로고침 없이 유지 가능)
            if (song.id) {
                const newUrl = `${window.location.pathname}?id=${song.id}`;
                window.history.pushState({ path: newUrl }, '', newUrl);
            }
            showLyrics(song);
        });
        songListElement.appendChild(li);
    });
}

// 3. 가사 및 영상 보여주기 함수
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
                <div class="lyric-line ${singerClass}" style="margin-bottom: 20px; line-height: 1.6;">
                    <div class="lyric-ja" style="font-size: 1.1em;">
                        ${line.ja || ""}
                    </div>
                    <div class="lyric-pron" style="font-size: 0.9em; margin-top: 4px;">
                        ${line.pronunciation || ""}
                    </div>
                    <div class="lyric-ko" style="font-size: 1em; margin-top: 2px;">
                        ${line.ko || ""}
                    </div>
                </div>
                `;
            }).join('');

            lyricsText.innerHTML = lyricsHtml;
            updateVisibility();

        } else if (typeof song.lyrics === 'string') {
            const formattedLyrics = song.lyrics.replace(/\n/g, '<br>');
            lyricsText.innerHTML = formattedLyrics;
        } else {
            lyricsText.innerHTML = "가사 데이터를 불러올 수 없는 형식입니다.";
        }
    }

    // 영상 로딩 로직
    const videoFrame = document.getElementById('video-frame');
    const videoLink = document.getElementById('video-link');

    if (videoFrame && videoLink) {
        if (song.videoUrl && song.videoUrl.trim() !== "") {
            videoFrame.src = song.videoUrl;
            videoLink.href = song.Url;
            videoWrapper?.classList.remove('hidden');
        } else {
            videoFrame.src = "";
            videoLink.href = "";
            videoWrapper?.classList.add('hidden');
        }
    }

    document.querySelector('.lyrics-view')?.scrollTo({ top: 0, behavior: 'smooth' });
}

searchInput?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();

    const filteredSongs = allSongs.filter(song =>
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query) ||
        (song.krTitle && song.krTitle.toLowerCase().includes(query)) ||
        (song.krArtist && song.krArtist.toLowerCase().includes(query))
    );

    renderList(filteredSongs);
});

let Hamburger_Btn = document.getElementById("HamburgerBtn");
let Sidebar = document.getElementById("Sidebar");
let Singers = document.getElementById("singer-legend");

Hamburger_Btn.addEventListener('click', () => {
    MSidebar *= -1;
    if (MSidebar > 0) {
        Sidebar.style.display = "flex";
        Singers.style.display = "block";

    } else {
        Sidebar.style.display = "none";
        Singers.style.display = "none";
    }
});

const observer = new ResizeObserver(entries => {
    for (let entry of entries) {
        const width = entry.contentRect.width;
        if (width > 1052) {
            Sidebar.style.display = "flex";
            Singers.style.display = "block";
        } else {
            if (MSidebar > 0) {
                Sidebar.style.display = "flex";
                Singers.style.display = "block";

            } else {
                Sidebar.style.display = "none";
                Singers.style.display = "none";
            }
        }
    }
});

observer.observe(document.body);

// 초기화
loadSongs();