const songListElement = document.getElementById('song-list');
const lyricsContent = document.getElementById('lyrics-content');
const welcomeMessage = document.getElementById('welcome-message');
const displayTitle = document.getElementById('display-title');
const displayArtist = document.getElementById('display-artist');
const lyricsText = document.getElementById('lyrics-text');

/** * [업데이트] 영상 플레이어를 위한 DOM 요소 생성 및 추가
 * CSS에서 이 요소를 우측 상단에 배치하시면 됩니다.
 */
const videoWrapper = document.createElement('div');
videoWrapper.id = 'video-container';
videoWrapper.className = 'hidden'; // 처음엔 숨김
videoWrapper.innerHTML = `
    <iframe id="video-frame" 
            src="" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen>
    </iframe>
`;
// 가사 영역 상단이나 container 내부에 삽입 (상황에 맞게 조정 가능)
document.querySelector('.lyrics-view').prepend(videoWrapper);


// 1. JSON 파일에서 데이터 가져오기
async function loadSongs() {
    try {
        const response = await fetch('songs.json');
        if (!response.ok) {
            throw new Error('데이터를 불러오는 데 실패했습니다.');
        }
        const songs = await response.json();
        renderList(songs);
    } catch (error) {
        console.error('Error:', error);
        songListElement.innerHTML = '<li>노래 목록을 불러올 수 없습니다.</li>';
    }
}

// 2. 리스트 렌더링 함수
function renderList(songs) {
    songListElement.innerHTML = '';
    songs.forEach(song => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${song.title}</strong><br><small>${song.artist}</small>`;
        li.addEventListener('click', () => {
            // [업데이트] 활성화 상태 표시를 위한 클래스 토글 (선택 사항)
            document.querySelectorAll('#song-list li').forEach(item => item.classList.remove('active'));
            li.classList.add('active');

            showLyrics(song);
        });
        songListElement.appendChild(li);
    });
}

// 3. 가사 및 영상 보여주기 함수
function showLyrics(song) {
    welcomeMessage.classList.add('hidden');
    lyricsContent.classList.remove('hidden');

    displayTitle.innerText = song.title;
    displayArtist.innerText = song.artist;

    // 가사 변환 (\n -> <br>)
    const formattedLyrics = song.lyrics.replace(/\n/g, '<br>');
    lyricsText.innerHTML = formattedLyrics;

    // [핵심 업데이트] 영상 로딩 로직
    const videoFrame = document.getElementById('video-frame');

    if (song.videoUrl && song.videoUrl.trim() !== "") {
        videoFrame.src = song.videoUrl;
        videoWrapper.classList.remove('hidden');
    } else {
        videoFrame.src = ""; // URL이 없으면 초기화
        videoWrapper.classList.add('hidden');
    }

    // 가사 영역 최상단으로 스크롤
    document.querySelector('.lyrics-view').scrollTo({ top: 0, behavior: 'smooth' });
}

// 초기화
loadSongs();