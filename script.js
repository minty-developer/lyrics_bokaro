const songListElement = document.getElementById('song-list');
const lyricsContent = document.getElementById('lyrics-content');
const welcomeMessage = document.getElementById('welcome-message');
const displayTitle = document.getElementById('display-title');
const displayArtist = document.getElementById('display-artist');
const lyricsText = document.getElementById('lyrics-text');
const searchInput = document.getElementById('search-input');

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
// 가사 영역 상단이나 container 내부에 삽입[cite: 3]
document.querySelector('.lyrics-view')?.prepend(videoWrapper);


// 1. JSON 파일에서 데이터 가져오기[cite: 3]
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

// 2. 리스트 렌더링 함수[cite: 3]
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

// 3. 가사 및 영상 보여주기 함수[cite: 3]
function showLyrics(song) {
    welcomeMessage?.classList.add('hidden');
    lyricsContent?.classList.remove('hidden');

    // 요소가 정상적으로 존재하는지 확인 후 값 할당 (HTML 오타 시 에러 방지)[cite: 3]
    if (displayTitle) displayTitle.innerText = song.title;
    if (displayArtist) displayArtist.innerText = song.artist;

    // 가사 렌더링: 객체 배열 형태 처리
    if (lyricsText && song.lyrics) {
        // song.lyrics가 배열이고, 첫 번째 요소가 객체인지 확인 (구조 검증)
        if (Array.isArray(song.lyrics) && typeof song.lyrics[0] === 'object') {

            // map 함수를 써서 각 줄(line)마다 HTML 블록을 생성
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
            `).join(''); // 배열을 하나의 문자열(HTML)로 합침

            lyricsText.innerHTML = lyricsHtml;

        } else if (typeof song.lyrics === 'string') {
            // 기존 통짜 문자열 데이터 호환용[cite: 3]
            const formattedLyrics = song.lyrics.replace(/\n/g, '<br>');
            lyricsText.innerHTML = formattedLyrics;
        } else {
            lyricsText.innerHTML = "가사 데이터를 불러올 수 없는 형식입니다.";
        }
    }

    // 영상 로딩 로직[cite: 3]
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

    // 가사 영역 최상단으로 스크롤[cite: 3]
    document.querySelector('.lyrics-view')?.scrollTo({ top: 0, behavior: 'smooth' });
}

searchInput?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();

    const filteredSongs = allSongs.filter(song =>
        // 1. 기존 영문/일문 제목 및 가수 검색[cite: 3]
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query) ||
        // 2. 한글 제목 및 한글 가수 검색 조건 추가 (데이터 필드명에 맞게 조정 가능)[cite: 3]
        (song.krTitle && song.krTitle.toLowerCase().includes(query)) ||
        (song.krArtist && song.krArtist.toLowerCase().includes(query))
    );

    renderList(filteredSongs);
});

// 초기화[cite: 3]
loadSongs();