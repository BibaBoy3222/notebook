$(document).ready(function() {
    console.log("=== СКРИПТ ЗАПУЩЕН ===");

    const VOICE_VOLUME = 0.8;
    const BG_VOLUME = 0.1;

    // Определяем, мобильное устройство или нет
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    console.log("Мобильное устройство:", isMobile ? "Да" : "Нет");

    // ===== НАСТРОЙ СООТВЕТСТВИЕ ЗДЕСЬ =====
    // pageNumber (от turn.js) → индекс элемента .page в DOM
    // Страницы turn.js: 1 – обложка, 2 – первая внутренняя, 3 – вторая и т.д.
    const pageToIndex = {
        1: 1,  // обложка – всегда индекс 0
        2: 2,  // первая внутренняя (Страница 1) – сюда поставь индекс, где лежит str1.mp3
        3: 3,  // вторая внутренняя (Страница 2) – индекс для str2.mp3
        4: 3,  // третья внутренняя (Страница 3) – индекс для str3.mp3
        5: 4,  // четвёртая внутренняя (Страница 4) – индекс для str4.mp3
        6: 5   // пятая внутренняя (Страница 5) – индекс для str5.mp3
    };
    // ======================================

    $("#flipbook").turn({
        width: 550,
        height: 750,
        autoCenter: true,
        display: 'single',
        elevation: 50,
        gradients: false,
        duration: 600,
        acceleration: true
    });

    let currentVoice = null;
    let bgMusic = document.getElementById('bg-music');
    if (bgMusic) bgMusic.volume = BG_VOLUME;

    // Флаг, был ли уже первый клик/взаимодействие
    let userInteracted = false;

    function stopVoice() {
        if (currentVoice) {
            currentVoice.pause();
            currentVoice.currentTime = 0;
        }
    }

    function playVoiceForPage(pageNumber) {
        console.log(`▶️ Попытка включить голос для страницы ${pageNumber}`);
        
        let index = pageToIndex[pageNumber];
        if (index === undefined) {
            console.warn(`⚠️ Для страницы ${pageNumber} не задан индекс, пропускаем`);
            return;
        }

        let voiceElement = $("#flipbook .page").eq(index).find(".page-audio")[0];
        if (voiceElement) {
            // Если на мобильном и ещё не было взаимодействия, не пытаемся играть
            if (isMobile && !userInteracted) {
                console.log("📱 Мобильное устройство: ждём первого касания");
                return;
            }

            stopVoice();
            voiceElement.volume = VOICE_VOLUME;
            
            // Небольшая задержка для мобильных, чтобы анимация не мешала
            let delay = isMobile ? 100 : 0;
            setTimeout(() => {
                voiceElement.play()
                    .then(() => {
                        currentVoice = voiceElement;
                        console.log(`✅ Голос для страницы ${pageNumber} запущен (индекс ${index})`);
                    })
                    .catch(error => {
                        console.error(`❌ Ошибка воспроизведения голоса для страницы ${pageNumber}:`, error);
                        // Если ошибка из-за отсутствия взаимодействия, запоминаем
                        if (error.name === "NotAllowedError") {
                            userInteracted = false;
                        }
                    });
            }, delay);
        } else {
            console.log(`ℹ️ На странице ${pageNumber} (индекс ${index}) нет аудио`);
        }
    }

    function playBgMusic() {
        if (!userInteracted) return;
        if (bgMusic && bgMusic.paused) {
            bgMusic.play().catch(e => console.log("Фон не запустился:", e));
        }
    }

    // Функция для обработки первого взаимодействия
    function handleFirstInteraction() {
        if (userInteracted) return;
        userInteracted = true;
        console.log("👆 Первое взаимодействие с книгой");
        
        playBgMusic();
        let currentPage = $("#flipbook").turn("page");
        
        // Небольшая задержка для мобильных
        setTimeout(() => {
            playVoiceForPage(currentPage);
        }, isMobile ? 200 : 0);
    }

    // События для отслеживания первого взаимодействия
    $(".notebook").on("click touchstart", function(e) {
        handleFirstInteraction();
    });

    $("#playSound").on("click touchstart", function() {
        handleFirstInteraction();
        // Кнопка дополнительно запускает голос для текущей страницы
        let currentPage = $("#flipbook").turn("page");
        setTimeout(() => {
            playVoiceForPage(currentPage);
        }, isMobile ? 100 : 0);
    });

    // При перелистывании
    $("#flipbook").on("turned", function(event, pageNumber, view) {
        console.log(`📖 Событие turned, pageNumber = ${pageNumber}`);
        
        // На мобильных добавляем небольшую задержку после перелистывания
        if (isMobile) {
            setTimeout(() => {
                playVoiceForPage(pageNumber);
            }, 150);
        } else {
            playVoiceForPage(pageNumber);
        }
    });

    // Разрешаем только нижние углы
    $("#flipbook").on("start", function(event, pageObject, corner, page) {
        if (corner === "tl" || corner === "tr") {
            console.log("⛔ Запрещён верхний угол");
            return false;
        }
        return true;
    });

    // Для мобильных: обрабатываем касание по странице
    if (isMobile) {
        $("#flipbook").on("touchstart", ".page", function(e) {
            // Не блокируем событие, просто отмечаем взаимодействие
            handleFirstInteraction();
        });
    }

    // ===== ОТЛАДКА =====
    console.log("=== ТЕКУЩАЯ СТРУКТУРА СТРАНИЦ ===");
    $("#flipbook .page").each(function(index) {
        let title = $(this).find("h2").text() || "обложка";
        let audio = $(this).find(".page-audio")[0];
        console.log(`Индекс ${index}: заголовок "${title}", аудио:`, audio ? audio.src.split('/').pop() : "нет");
    });
    console.log("=== ИСПОЛЬЗУЕМОЕ СООТВЕТСТВИЕ pageToIndex ===", pageToIndex);
});
