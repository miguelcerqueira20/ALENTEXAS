const targetDate = new Date('2026-07-23T00:00:00+01:00');
const startDate = new Date('2026-06-19T00:00:00+01:00');

const PLAYLIST_ID = '2OfgaAqnqTT55NSZGFM4HT';
const PLAYLIST_URI = `spotify:playlist:${PLAYLIST_ID}`;
const PLAYLIST_URL = `https://open.spotify.com/playlist/${PLAYLIST_ID}`;

const USE_LOCAL_AUDIO = false;
const LOCAL_AUDIO_FILE = 'audio/alentexas.mp3';

const el = {
  days: document.getElementById('days'),
  hours: document.getElementById('hours'),
  minutes: document.getElementById('minutes'),
  seconds: document.getElementById('seconds'),
  status: document.getElementById('status'),
  progressBar: document.getElementById('progressBar'),
  progressLabel: document.getElementById('progressLabel'),
  rider: document.getElementById('rider'),
  spotifyEmbed: document.getElementById('spotifyEmbed'),
  spotifyRefresh: document.getElementById('spotifyRefresh'),
  startExperience: document.getElementById('startExperience'),
  entryGate: document.getElementById('entryGate'),
  musicFeedback: document.getElementById('musicFeedback'),
  localAudio: document.getElementById('localAudio'),
  slideshowStage: document.getElementById('slideshowStage'),
  slideDots: document.getElementById('slideDots'),
  prevSlide: document.getElementById('prevSlide'),
  nextSlide: document.getElementById('nextSlide'),
};

let spotifyController = null;
let spotifyReady = false;
let spotifyStarted = false;
let pendingStart = false;

let slideshowIndex = 0;
let slideshowTimer = null;
let slideshowSlides = [];
let slideshowDots = [];

const pad = (value) => String(value).padStart(2, '0');
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function updateCountdown() {
  const now = new Date();
  const diff = targetDate - now;

  if (diff <= 0) {
    el.days.textContent = '00';
    el.hours.textContent = '00';
    el.minutes.textContent = '00';
    el.seconds.textContent = '00';
    el.status.textContent = 'ALENTEXAS chegou. Está na hora de levantar poeira.';
    el.progressBar.style.width = '100%';
    el.progressLabel.textContent = '100%';
    el.rider.style.left = '100%';
    document.body.classList.add('arrived');
    return;
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  el.days.textContent = pad(days);
  el.hours.textContent = pad(hours);
  el.minutes.textContent = pad(minutes);
  el.seconds.textContent = pad(seconds);

  const totalJourney = targetDate - startDate;
  const elapsed = now - startDate;
  const percent = clamp((elapsed / totalJourney) * 100, 0, 100);
  el.progressBar.style.width = `${percent}%`;
  el.progressLabel.textContent = `${Math.round(percent)}%`;
  el.rider.style.left = `${percent}%`;

  if (days > 20) {
    el.status.textContent = 'A caravana ainda vai longa, mas já cheira a verão.';
  } else if (days > 7) {
    el.status.textContent = 'Está quase. As botas já deviam estar à porta.';
  } else if (days > 1) {
    el.status.textContent = 'Última semana. O rancho está a aquecer.';
  } else {
    el.status.textContent = 'Últimas horas. A poeira vai subir.';
  }
}

function setMusicFeedback(message, type = 'info') {
  if (!el.musicFeedback) return;
  el.musicFeedback.textContent = message;
  el.musicFeedback.dataset.type = type;
}

function closeEntryGate() {
  document.body.classList.add('experience-started');
  if (!el.entryGate) return;
  el.entryGate.classList.add('hidden');
  el.entryGate.setAttribute('aria-hidden', 'true');
}

async function playLocalAudioIfEnabled() {
  if (!USE_LOCAL_AUDIO || !el.localAudio) return false;

  try {
    if (!el.localAudio.getAttribute('src')) {
      el.localAudio.src = LOCAL_AUDIO_FILE;
    }
    el.localAudio.volume = 0.55;
    el.localAudio.loop = true;
    await el.localAudio.play();
    setMusicFeedback('Música local ativa. ALENTEXAS entrou em modo rancho.', 'success');
    return true;
  } catch (error) {
    setMusicFeedback('O browser bloqueou o áudio local. Tenta clicar novamente no botão da música.', 'warning');
    return false;
  }
}

function tryPlaySpotify() {
  if (!spotifyReady || !spotifyController) {
    pendingStart = true;
    setMusicFeedback('A preparar o player Spotify... se não arrancar, carrega no play do player.', 'warning');
    return;
  }

  pendingStart = false;
  setMusicFeedback('A tentar iniciar a playlist no Spotify...', 'info');

  try {
    const maybePromise = spotifyController.play();
    if (maybePromise && typeof maybePromise.catch === 'function') {
      maybePromise.catch(() => {
        setMusicFeedback('O Spotify bloqueou o play automático. Carrega no play dentro do player.', 'warning');
      });
    }
  } catch (error) {
    setMusicFeedback('O Spotify bloqueou o play automático. Carrega no play dentro do player.', 'warning');
  }

  setTimeout(() => {
    if (!spotifyStarted) {
      setMusicFeedback('Se ainda não ouvires música, carrega no play dentro do player Spotify.', 'warning');
    }
  }, 1800);
}

async function startExperience() {
  closeEntryGate();
  const localStarted = await playLocalAudioIfEnabled();
  if (!localStarted) tryPlaySpotify();
}

window.startAlentexas = startExperience;
window.tryPlaySpotify = tryPlaySpotify;

window.onSpotifyIframeApiReady = (IFrameAPI) => {
  if (!el.spotifyEmbed) return;

  const options = {
    uri: PLAYLIST_URI,
    width: Math.min(840, Math.max(300, el.spotifyEmbed.offsetWidth || 640)),
    height: 152,
  };

  IFrameAPI.createController(el.spotifyEmbed, options, (EmbedController) => {
    spotifyController = EmbedController;
    spotifyReady = true;
    setMusicFeedback('Spotify pronto. Usa o botão “Começar música” ou o play do player.', 'info');

    spotifyController.addListener('ready', () => {
      spotifyReady = true;
      if (pendingStart) tryPlaySpotify();
    });

    spotifyController.addListener('playback_started', () => {
      spotifyStarted = true;
      setMusicFeedback('Playlist ativa. Poeira no ar.', 'success');
    });

    spotifyController.addListener('playback_update', (event) => {
      if (event?.data && event.data.isPaused === false) {
        spotifyStarted = true;
        setMusicFeedback('Playlist ativa. Poeira no ar.', 'success');
      }
    });

    if (pendingStart) tryPlaySpotify();
  });
};

function clearSlideshowTimer() {
  if (slideshowTimer) {
    clearTimeout(slideshowTimer);
    slideshowTimer = null;
  }
}

function scheduleNextSlide(ms = 4200) {
  clearSlideshowTimer();
  slideshowTimer = setTimeout(() => showSlide(slideshowIndex + 1), ms);
}

function showSlide(index) {
  if (!slideshowSlides.length) return;

  const total = slideshowSlides.length;
  slideshowIndex = (index + total) % total;

  slideshowSlides.forEach((slide, i) => {
    const active = i === slideshowIndex;
    slide.classList.toggle('active', active);

    const video = slide.querySelector('video');
    if (!video) return;

    video.pause();
    video.currentTime = 0;
    video.muted = true;
    video.setAttribute('muted', '');

    if (active) {
      const attempt = video.play();
      if (attempt && typeof attempt.catch === 'function') attempt.catch(() => {});
    }
  });

  slideshowDots.forEach((dot, i) => dot.classList.toggle('active', i === slideshowIndex));

  const activeSlide = slideshowSlides[slideshowIndex];
  const activeVideo = activeSlide.querySelector('video');

  if (activeVideo) {
    const fallbackDuration = 6500;
    const useDuration = Number.isFinite(activeVideo.duration) && activeVideo.duration > 1
      ? Math.min(activeVideo.duration * 1000, 12000)
      : fallbackDuration;
    activeVideo.onended = () => showSlide(slideshowIndex + 1);
    scheduleNextSlide(useDuration);
  } else {
    scheduleNextSlide(4200);
  }
}

function initSlideshow() {
  if (!el.slideshowStage) return;

  slideshowSlides = Array.from(el.slideshowStage.querySelectorAll('.slide-item'));
  if (!slideshowSlides.length) return;

  if (el.slideDots) {
    el.slideDots.innerHTML = '';
    slideshowSlides.forEach((_, index) => {
      const dot = document.createElement('button');
      dot.className = 'slide-dot';
      dot.type = 'button';
      dot.setAttribute('aria-label', `Ir para slide ${index + 1}`);
      dot.addEventListener('click', () => showSlide(index));
      el.slideDots.appendChild(dot);
    });
    slideshowDots = Array.from(el.slideDots.querySelectorAll('.slide-dot'));
  }

  slideshowSlides.forEach((slide) => {
    const video = slide.querySelector('video');
    if (video) {
      video.muted = true;
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '');
    }
  });

  showSlide(0);
}

function bindEvents() {
  if (el.startExperience) {
    el.startExperience.addEventListener('click', startExperience);
    el.startExperience.addEventListener('touchend', (event) => {
      event.preventDefault();
      startExperience();
    }, { passive: false });
  }

  if (el.spotifyRefresh) {
    el.spotifyRefresh.addEventListener('click', () => {
      spotifyStarted = false;
      if (USE_LOCAL_AUDIO && el.localAudio) {
        el.localAudio.currentTime = 0;
        playLocalAudioIfEnabled();
        return;
      }
      if (spotifyController) {
        spotifyController.loadUri(PLAYLIST_URI);
        setTimeout(tryPlaySpotify, 250);
      } else {
        window.open(PLAYLIST_URL, '_blank', 'noreferrer');
      }
    });
  }

  if (el.prevSlide) el.prevSlide.addEventListener('click', () => showSlide(slideshowIndex - 1));
  if (el.nextSlide) el.nextSlide.addEventListener('click', () => showSlide(slideshowIndex + 1));

  document.addEventListener('keydown', (event) => {
    if ((event.key === 'Enter' || event.key === ' ') && document.activeElement === el.startExperience) {
      event.preventDefault();
      startExperience();
    }
  });
}

function init() {
  bindEvents();
  updateCountdown();
  setInterval(updateCountdown, 1000);
  initSlideshow();
}

init();
