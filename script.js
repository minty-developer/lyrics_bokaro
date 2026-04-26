const songListElement = document.getElementById('song-list');
const lyricsContent = document.getElementById('lyrics-content');
const welcomeMessage = document.getElementById('welcome-message');
const displayTitle = document.getElementById('display-title');
const displayArtist = document.getElementById('display-artist');
const lyricsText = document.getElementById('lyrics-text');

// 1. JSON 파일에서 데이터 가져오기
async function loadSongs() {
    try {
        const response = await fetch('songs.json'); // JSON 파일 호출
        if (!response.ok) {
            throw new Error('데이터를 불러오는 데 실패했습니다.');
        }
        const songs = await response.json(); // JSON 파싱
        renderList(songs); // 가져온 데이터로 리스트 생성
    } catch (error) {
        console.error('Error:', error);
        songListElement.innerHTML = '<li>노래 목록을 불러올 수 없습니다.</li>';
    }
}

// 2. 리스트 렌더링 함수
function renderList(songs) {
    songListElement.innerHTML = ''; // 초기화
    songs.forEach(song => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${song.title}</strong><br><small>${song.artist}</small>`;
        li.addEventListener('click', () => showLyrics(song));
        songListElement.appendChild(li);
    });
}

// 3. 가사 보여주기 함수 수정
function showLyrics(song) {
    welcomeMessage.classList.add('hidden');
    lyricsContent.classList.remove('hidden');

    displayTitle.innerText = song.title;
    displayArtist.innerText = song.artist;
    
    // 핵심 변경 사항: innerText 대신 innerHTML 사용
    // JSON의 \n을 <br>로 치환하여 줄바꿈을 적용합니다.
    const formattedLyrics = song.lyrics.replace(/\n/g, '<br>');
    lyricsText.innerHTML = formattedLyrics;

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 초기화: 페이지 로드 시 JSON 데이터 불러오기
loadSongs();