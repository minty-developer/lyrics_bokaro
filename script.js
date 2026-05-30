const songListElement = document.getElementById('song-list');
const lyricsContent = document.getElementById('lyrics-content');
const welcomeMessage = document.getElementById('welcome-message');
const displayTitle = document.getElementById('display-title');
const displayArtist = document.getElementById('display-artist');
const lyricsText = document.getElementById('lyrics-text');
const searchInput = document.getElementById('search-input');

// 새로 추가된 체크박스 요소 가져오기
const toggleFurigana = document.getElementById('toggle-furigana');
const togglePron = document.getElementById('toggle-pron');
const toggleKo = document.getElementById('toggle-ko');

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
`;
// 가사 영역 상단이나 container 내부에 삽입[cite: 5]
document.querySelector('.lyrics-view')?.prepend(videoWrapper);


// 가사 요소 표시 상태 업데이트 함수
function updateVisibility() {
    // 각각의 태그와 클래스를 모두 찾아서 배열 형태로 가져옴
    const rtElements = document.querySelectorAll('rt');
    const pronElements = document.querySelectorAll('.lyric-pron');
    const koElements = document.querySelectorAll('.lyric-ko');

    // 체크박스 상태에 따라 화면 표시 여부(display) 변경
    if (toggleFurigana) rtElements.forEach(el => el.style.display = toggleFurigana.checked ? '' : 'none');
    if (togglePron) pronElements.forEach(el => el.style.display = togglePron.checked ? '' : 'none');
    if (toggleKo) koElements.forEach(el => el.style.display = toggleKo.checked ? '' : 'none');
}

// 토글 버튼에 이벤트 리스너 연결
toggleFurigana?.addEventListener('change', updateVisibility);
togglePron?.addEventListener('change', updateVisibility);
toggleKo?.addEventListener('change', updateVisibility);


// 1. JSON 파일에서 데이터 가져오기[cite: 5]
async function loadSongs() {
    try {
        const response = await fetch('songs.json');
        if (!response.ok) {
            throw new Error('데이터를 불러오는 데 실패했습니다.');
        }
        allSongs = await response.json();
        renderList(allSongs);
    } catch (error) {
        console.error('Error:', error);
        if (songListElement) {
            songListElement.innerHTML = '<li>노래 목록을 불러올 수 없습니다.</li>';
        }
    }
}

// 2. 리스트 렌더링 함수[cite: 5]
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
        li.addEventListener('click', () => showLyrics(song));
        songListElement.appendChild(li);
    });
}

// 3. 가사 및 영상 보여주기 함수[cite: 5]
function showLyrics(song) {
    welcomeMessage?.classList.add('hidden');
    lyricsContent?.classList.remove('hidden');

    // 요소가 정상적으로 존재하는지 확인 후 값 할당 (HTML 오타 시 에러 방지)[cite: 5]
    if (displayTitle) displayTitle.innerText = song.title;
    if (displayArtist) displayArtist.innerText = song.artist;

    // 가사 렌더링: 객체 배열 형태 처리
    if (lyricsText && song.lyrics) {
        if (Array.isArray(song.lyrics) && typeof song.lyrics[0] === 'object') {

            const lyricsHtml = song.lyrics.map(line => `
                <div class="lyric-line" style="margin-bottom: 20px; line-height: 1.6;">
                    <div class="lyric-ja" style="font-size: 1.1em; color: #222;">
                        ${line.ja || ""}
                    </div>
                    <div class="lyric-pron" style="font-size: 0.9em; color: #666; margin-top: 4px;">
                        ${line.pronunciation || ""}
                    </div>
                    <div class="lyric-ko" style="font-size: 1em; color: #0056b3; margin-top: 2px;">
                        ${line.ko || ""}
                    </div>
                </div>
            `).join('');

            lyricsText.innerHTML = lyricsHtml;

            // 💡 가사가 새로 그려졌으므로, 현재 체크박스 상태에 맞게 가리기/보이기 적용
            updateVisibility();

        } else if (typeof song.lyrics === 'string') {
            const formattedLyrics = song.lyrics.replace(/\n/g, '<br>');
            lyricsText.innerHTML = formattedLyrics;
        } else {
            lyricsText.innerHTML = "가사 데이터를 불러올 수 없는 형식입니다.";
        }
    }

    // 영상 로딩 로직[cite: 5]
    const videoFrame = document.getElementById('video-frame');

    if (videoFrame) {
        if (song.videoUrl && song.videoUrl.trim() !== "") {
            videoFrame.src = song.videoUrl;
            videoWrapper?.classList.remove('hidden');
        } else {
            videoFrame.src = "";
            videoWrapper?.classList.add('hidden');
        }
    }

    // 가사 영역 최상단으로 스크롤[cite: 5]
    document.querySelector('.lyrics-view')?.scrollTo({ top: 0, behavior: 'smooth' });
}

searchInput?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();

    const filteredSongs = allSongs.filter(song =>
        // 1. 기존 영문/일문 제목 및 가수 검색[cite: 5]
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query) ||
        // 2. 한글 제목 및 한글 가수 검색 조건 추가[cite: 5]
        (song.krTitle && song.krTitle.toLowerCase().includes(query)) ||
        (song.krArtist && song.krArtist.toLowerCase().includes(query))
    );

    renderList(filteredSongs);
});

// 초기화[cite: 5]
loadSongs();