// ========================================================================
//                                 DOM
// ========================================================================

// UI 관련 DOM
const songListElement = document.getElementById('song-list');
const lyricsContent = document.getElementById('lyrics-content');
const welcomeMessage = document.getElementById('welcome-message');
const displayTitle = document.getElementById('display-title');
const displayArtist = document.getElementById('display-artist');
const lyricsText = document.getElementById('lyrics-text');
const searchInput = document.getElementById('search-input');
const songSortSelect = document.getElementById('song-sort-select');
const settingsStatus = document.getElementById('settings-status');
const songInformation = document.getElementById('song-information');
const songInformationList = document.getElementById('song-information-list');

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
const infoBtn = document.getElementById("infoBtn");

// 사이드바 관련 DOM
const hamburgerBtn = document.getElementById('HamburgerBtn');
const sidebar = document.getElementById('Sidebar');
const sidebarOverlay = document.getElementById('SidebarOverlay');
const noticeModal = document.getElementById('NoticeModal');
const mobileCloseBtn = document.getElementById('MobileCloseBtn');

// ========================================================================
//                                 List
// ========================================================================

let allSongs = [];
let nowSongs = [];

// ========================================================================
//                             Local variable
// ========================================================================

let sortType = localStorage.getItem("lyrics_bokaro_sort_type") ?? "title"; // ( title | artist | latest | oldest )

// ========================================================================
//                                Event
// ========================================================================

// 모달창 열기/닫기 이벤트
settingsBtn?.addEventListener('click', () => settingsModal.classList.remove('hidden'));
closeSettingsBtn?.addEventListener('click', () => settingsModal.classList.add('hidden'));
closeSortMenuBtn?.addEventListener('click', () => sortMenu.classList.add("hidden"));

// 사이드바 열기/닫기 이벤트
hamburgerBtn?.addEventListener('click', () => toggleSidebar(true));
mobileCloseBtn?.addEventListener('click', () => toggleSidebar(false));
sidebarOverlay?.addEventListener('click', () => toggleSidebar(false));

// 정렬 모달창 열기/닫기 이벤트
sortBtn?.addEventListener("click", () => sortMenu?.classList.remove('hidden'));
songSortSelect?.addEventListener('change', (event) => renderListWithSorts(event.target.value));
songSortSelect && (songSortSelect.value = sortType);

const featureHandlers = {
    '작곡가·작사가 검색': handleCreditSearch,
    '줄 간격': handleReadingSettings,
    '문단 간격': handleReadingSettings,
    '글자 크기 조절': handleReadingSettings,
    '폰트 변경': handleReadingSettings,
    '파트별 구분': handleReadingSettings,
    '보컬 필터': handleReadingSettings,
    '집중 모드': handleReadingSettings,
    '번역 언어 선택': handleTranslationSettings,
    '원문·번역 전환': handleTranslationSettings,
    '번역본 비교': handleTranslationSettings,
    '자동 스크롤': handleAutoScrollSettings,
    '자동 스크롤 속도': handleAutoScrollSettings,
    '자동 스크롤 일시정지': handleAutoScrollSettings,
    '현재 가사 강조': handleAutoScrollSettings,
    '전체 가사 복사': handleLyricsCopy,
    '선택한 가사 복사': handleLyricsCopy,
    '곡 언어 정보': handleSongMetadata,
    '앨범 정보': handleSongMetadata,
    '특정 가사 링크 공유': handleLyricsShare,
    '가사 추가 요청': handleContribution,
    '오타 신고': handleContribution,
    '번역 수정 제안': handleContribution
};

document.querySelectorAll('.feature-button[data-feature]').forEach((button) => {
    button.addEventListener('click', () => {
        const handler = featureHandlers[button.dataset.feature];
        handler?.(button.dataset.feature);
    });
});

const settingsControls = [...document.querySelectorAll('[data-setting]')];
const savedDisplaySettings = JSON.parse(localStorage.getItem('lyrics_bokaro_display_settings') || '{}');
settingsControls.forEach((control) => {
    const savedValue = savedDisplaySettings[control.dataset.setting];
    if (savedValue !== undefined) {
        if (control.type === 'checkbox') control.checked = savedValue;
        else control.value = savedValue;
    }
    control.addEventListener('input', applyDisplaySettings);
    control.addEventListener('change', () => {
        applyDisplaySettings();
        announceSettingStatus(control.dataset.setting);
    });
});
applyDisplaySettings();

// 정보 페이지 열기 이벤트
infoBtn?.addEventListener('click', () => {
    window.open('./page/info.html', "_blank", "noopener,noreferrer");
});

// 가사 연결선 위치 조정 이벤트
window.addEventListener('resize', alignParallelTicks);
document.fonts?.ready.then(alignParallelTicks);

// 토글 버튼 이벤트 연결
toggleFurigana?.addEventListener('change', updateVisibility);
togglePron?.addEventListener('change', updateVisibility);
toggleKo?.addEventListener('change', updateVisibility);

// ========================================================================
//                              Function
// ========================================================================

// 사이드 바를 열고 닫는 함수
function toggleSidebar(show) {
    if (show) {
        sidebar.classList.add('open');
        sidebarOverlay.classList.remove('hidden');
    } else {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.add('hidden');
    }
}

function showFeatureInProgress(featureName) {
    window.alert(`${featureName}: 아직 구현중입니다.`);
}

function applyDisplaySettings() {
    const read = (name) => document.querySelector(`[data-setting="${name}"]`);
    const value = (name) => read(name)?.value;
    const checked = (name) => !!read(name)?.checked;
    const root = document.documentElement;
    root.style.setProperty('--lyric-line-height', String(Number(value('lineHeight')) || 1.8));
    root.style.setProperty('--lyric-paragraph-gap', `${Number(value('paragraphGap')) || 0}px`);
    root.style.setProperty('--lyric-font-size', `${Number(value('fontSize')) || 20}px`);
    const fontFamily = value('fontFamily') || 'Kosugi Maru';
    root.style.setProperty('--lyrics-font-family', fontFamily === 'sans-serif' ? fontFamily : JSON.stringify(fontFamily));
    lyricsText?.classList.toggle('parts-separated', checked('partSeparation'));
    document.body.classList.toggle('focus-mode', checked('focusMode'));

    const filter = value('vocalFilter') || 'all';
    lyricsText?.querySelectorAll('.lyric-line, .parallel-line').forEach((line) => {
        line.classList.toggle('filtered-out', filter !== 'all' && !line.classList.contains(`singer-${filter}`));
    });

    if (settingsControls.length) {
        const settings = Object.fromEntries(settingsControls.map((control) => [
            control.dataset.setting,
            control.type === 'checkbox' ? control.checked : control.value
        ]));
        localStorage.setItem('lyrics_bokaro_display_settings', JSON.stringify(settings));
    }
}

function announceSettingStatus(settingName) {
    if (!settingsStatus) return;
    settingsStatus.textContent = '';
}

function populateVocalFilters(songs) {
    const select = document.querySelector('[data-setting="vocalFilter"]');
    if (!select) return;
    const selected = select.value;
    const singers = [...new Set(songs.flatMap((song) => [
        song.singer,
        ...(Array.isArray(song.lyrics) ? song.lyrics.map((line) => line.singer) : [])
    ]).filter(Boolean))].sort();
    select.replaceChildren(new Option('모든 보컬', 'all'));
    singers.forEach((singer) => select.add(new Option(singer, singer)));
    select.value = singers.includes(selected) ? selected : 'all';
}

function renderSongInformation(song) {
    if (!songInformation || !songInformationList) return;
    const fields = [
        ['작곡', song.composer || song.music],
        ['작사', song.lyricist || song.lyricsBy]
    ].filter(([, value]) => value);
    songInformationList.replaceChildren(...fields.flatMap(([label, value]) => {
        const term = document.createElement('dt');
        term.textContent = label;
        const description = document.createElement('dd');
        description.textContent = value;
        return [term, description];
    }));
    songInformation.classList.toggle('hidden', fields.length === 0);
}

function handleCreditSearch(featureName) { showFeatureInProgress(featureName); }
function handleReadingSettings(featureName) { showFeatureInProgress(featureName); }
function handleTranslationSettings(featureName) { showFeatureInProgress(featureName); }
function handleAutoScrollSettings(featureName) { showFeatureInProgress(featureName); }
function handleLyricsCopy(featureName) { showFeatureInProgress(featureName); }
function handleSongMetadata(featureName) { showFeatureInProgress(featureName); }
function handleLyricsShare(featureName) { showFeatureInProgress(featureName); }
function handleContribution(featureName) { showFeatureInProgress(featureName); }

// 최신 버전 공지를 보여주는 함수
async function showNotice() {
    const response = await fetch("https://api.github.com/repos/minty-developer/lyrics_bokaro/releases/latest");

    if (!response.ok) {
        console.warn(
            `GitHub Release API 요청 실패: ${response.status}`
        );
        return;
    }

    const release = await response.json();

    const version = release.tag_name;
    const title = release.name;
    const date = release.published_at;
    const changes = release.body;

    const lastVersion = localStorage.getItem(
        "lyrics_bokaro_last_version"
    );

    if (!lastVersion || version !== lastVersion) {
        console.log(release);

        noticeModal.innerHTML = `
            <div class="modal-content" style="display: flex; flex-direction: column; width: 600px; max-width: 90vw; max-height: 80vh; padding: 20px; box-sizing: border-box;">
                <div class="modal-header" style="display: flex; flex-direction: column; margin-bottom: 10px;">
                    <h1 style="margin: 0; font-size: 1.5rem;">${title}</h1>
                    <small style="color: #666; margin-top: 4px;">
                        Update at ${date}
                    </small>
                </div>

                <div class="modal-section" style="flex: 1; overflow-y: auto; word-break: break-word; min-height: 0; margin-bottom: 10px;">
                    ${changes.replaceAll(" ", "&nbsp;")}
                </div>

                <button
                    id="noticeCloseButton"
                    style="width: 100px; height: 30px; margin-top: auto; align-self: center; background-color: #d00; color: #fff; border: none; border-radius: 5px; cursor: pointer; flex-shrink: 0;"
                >
                    확인
                </button>
            </div>
        `;

        document
            .getElementById("noticeCloseButton")
            ?.addEventListener("click", closeNotice);

        noticeModal.style.flexDirection = "column";
        noticeModal.classList.remove("hidden");

        localStorage.setItem(
            "lyrics_bokaro_last_version",
            version
        );
    }
}

// 공지 모달창을 닫는 함수
function closeNotice() {
    noticeModal.classList.add('hidden');
}

// parallel 지시선을 가사 세로 중앙에 정렬하는 함수
function alignParallelTicks() {
    const range = document.createRange();

    document.querySelectorAll('.parallel-line').forEach(line => {
        const ja = line.querySelector('.lyric-ja');
        if (!ja) return;

        const walker = document.createTreeWalker(ja, NodeFilter.SHOW_TEXT, {
            acceptNode: (node) =>
                node.textContent.trim() && !node.parentElement.closest('rt')
                    ? NodeFilter.FILTER_ACCEPT
                    : NodeFilter.FILTER_REJECT
        });

        let top = Infinity;
        let bottom = -Infinity;
        while (walker.nextNode()) {
            range.selectNodeContents(walker.currentNode);
            for (const rect of range.getClientRects()) {
                top = Math.min(top, rect.top);
                bottom = Math.max(bottom, rect.bottom);
            }
        }
        if (top === Infinity) return;

        const center = (top + bottom) / 2 - line.getBoundingClientRect().top;
        line.style.setProperty('--tick-y', `${center}px`);
    });
}

// 가사 표시 옵션 업데이트 함수
function updateVisibility() {
    const rtElements = document.querySelectorAll('rt');
    const pronElements = document.querySelectorAll('.lyric-pron');
    const koElements = document.querySelectorAll('.lyric-ko');

    if (toggleFurigana) rtElements.forEach(el => el.style.display = toggleFurigana.checked ? '' : 'none');
    if (togglePron) pronElements.forEach(el => el.style.display = togglePron.checked ? '' : 'none');
    if (toggleKo) koElements.forEach(el => el.style.display = toggleKo.checked ? '' : 'none');
    alignParallelTicks();
}

// JSON 데이터 로드
async function loadSongs() {
    try {
        const response = await fetch('./data/songs.json');
        if (!response.ok) throw new Error('데이터 로드 실패');
        
        allSongs = await response.json();
        nowSongs = allSongs;
        populateVocalFilters(allSongs);
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

// 리스트를 렌더링하는 함수
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

// 가사 한 줄 HTML 생성 (일반 / parallel 공용)
function renderLyricLine(line, song, isParallel) {
    const currentSinger = line.singer || song.singer;
    const singerClass = currentSinger ? `singer-${currentSinger}` : '';
    const cls = isParallel ? 'parallel-line' : 'lyric-line';
    const style = isParallel ? '' : ' style="margin-bottom: 20px;"';

    return `
    <div class="${cls} ${singerClass}"${style}>
        <div class="lyric-ja" style="font-size: 1.1em;">${line.ja || ""}</div>
        <div class="lyric-pron" style="font-size: 0.9em; margin-top: 4px;">${line.pronunciation || ""}</div>
        <div class="lyric-ko" style="font-size: 1em; margin-top: 2px;">${line.ko || ""}</div>
    </div>`;
}

// 배열 순서를 유지하면서, 연속된 같은 parallel 값을 하나의 그룹으로 묶음
function renderLyrics(lyrics, song) {
    const hasParallel = (l) => l.parallel !== undefined && l.parallel !== null && l.parallel !== '';
    let html = '';
    let i = 0;

    while (i < lyrics.length) {
        const line = lyrics[i];

        if (!hasParallel(line)) {
            html += renderLyricLine(line, song, false);
            i++;
            continue;
        }

        const pid = line.parallel;
        let inner = '';
        while (i < lyrics.length && hasParallel(lyrics[i]) && lyrics[i].parallel === pid) {
            inner += renderLyricLine(lyrics[i], song, true);
            i++;
        }
        html += `<div class="parallel-group" data-parallel="${pid}">${inner}</div>`;
    }

    return html;
}

// 가사 및 영상 표시
function showLyrics(song) {
    welcomeMessage?.classList.add('hidden');
    lyricsContent?.classList.remove('hidden');

    if (displayTitle) displayTitle.innerText = song.title;
    if (displayArtist) displayArtist.innerText = song.artist;
    renderSongInformation(song);

    if (lyricsText && song.lyrics) {
        if (Array.isArray(song.lyrics) && typeof song.lyrics[0] === 'object') {
            lyricsText.innerHTML = renderLyrics(song.lyrics, song);
            updateVisibility();
        } else if (typeof song.lyrics === 'string') {
            lyricsText.innerHTML = song.lyrics.replace(/\n/g, '<br>');
        } else {
            lyricsText.innerHTML = "데이터 형식을 확인할 수 없습니다.";
        }
    }
    applyDisplaySettings();

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
    if (songSortSelect) songSortSelect.value = Type;
    localStorage.setItem("lyrics_bokaro_sort_type", Type);
    renderList(sortSongs(nowSongs, Type));
    sortMenu?.classList.add('hidden');
}

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

// ========================================================================
//                                 Init
// ========================================================================

// 초기화
showNotice();
loadSongs();
