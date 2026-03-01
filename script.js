$(document).ready(function() {
    console.log("=== СКРИПТ ЗАПУЩЕН ===");

    const VOICE_VOLUME = 0.8;
    const BG_VOLUME = 0.1;

    // Определяем мобильное устройство
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
            if (isMobile && !userInteracted) {
                console.log("📱 Мобильное устройство: ждём первого касания");
                return;
            }

            stopVoice();
            voiceElement.volume = VOICE_VOLUME;
            
            // На мобильных добавляем задержку для завершения анимации
            let playPromise = voiceElement.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        currentVoice = voiceElement;
                        console.log(`✅ Голос для страницы ${pageNumber} запущен (индекс ${index})`);
                    })
                    .catch(error => {
                        console.error(`❌ Ошибка воспроизведения голоса для страницы ${pageNumber}:`, error);
                        if (error.name === "NotAllowedError") {
                            userInteracted = false;
                        }
                    });
            }
        } else {
            console.log(`ℹ️ На странице ${pageNumber} (индекс ${index}) нет аудио`);
        }
    }

    function playBgMusic() {
        if (!bgMusic) return;
        if (bgMusic.paused) {
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
        playVoiceForPage(currentPage);
    }

    // Обработчики первого взаимодействия
    $(".notebook").on("click touchstart", function(e) {
        handleFirstInteraction();
    });

    $("#playSound").on("click touchstart", function() {
        handleFirstInteraction();
        let currentPage = $("#flipbook").turn("page");
        playVoiceForPage(currentPage);
    });

    // При перелистывании страницы
    $("#flipbook").on("turned", function(event, pageNumber, view) {
        console.log(`📖 Событие turned, pageNumber = ${pageNumber}`);
        
        if (!userInteracted) {
            console.log("⚠️ Пользователь ещё не взаимодействовал, голос не включаем");
            return;
        }

        // На мобильных добавляем задержку, чтобы анимация завершилась
        if (isMobile) {
            setTimeout(() => {
                playVoiceForPage(pageNumber);
            }, 300); // увеличил задержку до 300 мс
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

    // Отдельно для мобильных: отслеживаем касание по страницам
    if (isMobile) {
        $("#flipbook").on("touchstart", ".page", function(e) {
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
