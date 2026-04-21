window.addEventListener('DOMContentLoaded', () => {


  let songs = {};
  let selectedArtist = "";
  let selectedDifficulty = "";
  let quizData = [];
  let currentQuestionIndex = 0;
  let correctCount = 0;
  let totalBonus = 0;

  // DOM取得
  const stopWatchPanel = document.getElementById("stopWatchPanel");
  const difficultyPanel = document.getElementById("difficultyPanel");
  const quizPanel = document.getElementById("quizPanel");
  const questionText = document.getElementById("question-text");
  const questionCounter = document.getElementById("question-counter");
  const feedback = document.getElementById("feedback");
  const difficultyTitle = document.getElementById("difficultyTitle");
  const difficultyButtons = document.querySelectorAll(".difficultyButton");
  const artistButtons = stopWatchPanel.querySelectorAll("button");
  const artistTitle = document.getElementById("artistTitle");
  const artistSubtitle = document.getElementById("artistSubtitle");

  let questionTimeout;
  let questionTimeLeft;
  let timerLimit; // 難易度別の制限時間



  //jsonからquiz情報取得
  fetch("lyrics.json")
    .then(response => {
      //読み込み失敗メッセージ
      if (!response.ok) {
        throw new Error("JSONの読み込みに失敗しました");
      }
      return response.json();
    })
    .then(data => {
      songs = data;
      console.log("songs.json を読み込みました", songs);
      // initQuiz(); ← これは不要
    })

    .catch(error => {
      console.error("エラー:", error);
    });


  // アーティスト選択
  artistButtons.forEach(button => {
    button.addEventListener('click', () => {
      selectedArtist = button.textContent.trim();
      stopWatchPanel.style.display = 'none';
      difficultyPanel.style.display = 'block';
      artistTitle.style.display = 'none';
      artistSubtitle.style.display = 'none';
    });
  });

  // 難易度ボタンに説明表示
  difficultyButtons.forEach(button => {
    button.addEventListener("mouseenter", () => {
      difficultyTitle.textContent = button.getAttribute("data-desc");
    });
    button.addEventListener("mouseleave", () => {
      difficultyTitle.textContent = "難易度を選んでね";
    });
  });

  // 難易度選択＆クイズ開始
  document.querySelectorAll(".difficultyButton").forEach(button => {
    button.addEventListener("click", () => {
      const text = button.textContent.trim();
      selectedDifficulty = text === "かんたん" ? "easy" : text === "ふつう" ? "normal" : "hard";
      timerLimit = selectedDifficulty === "easy" ? 30 : selectedDifficulty === "normal" ? 20 : 15;

      if (selectedArtist === "全アーティスト") {
        quizData = [];
        Object.keys(songs).forEach(artist => {
          if (songs[artist][selectedDifficulty]) {
            quizData = quizData.concat(songs[artist][selectedDifficulty]);
          }
        });
      } else {
        quizData = songs[selectedArtist][selectedDifficulty] || [];
      }

      if (quizData.length === 0) {
        alert("この組み合わせにはまだ問題がありません。");
        return;
      }

      shuffle(quizData);
      // 全アーティストモードの場合は10問に制限する（必要に応じて調整）
      if (selectedArtist === "全アーティスト" && quizData.length > 10) {
        quizData = quizData.slice(0, 10);
      }

      currentQuestionIndex = 0;
      correctCount = 0;
      totalBonus = 0;
      difficultyPanel.style.display = "none";
      quizPanel.style.display = "block";


      setQuizBackground();
      showQuestion();
    });
  });

  //cssに設定されている各アーティストの背景を設定
  function setQuizBackground() {
    quizPanel.classList.remove("quiz-bg-Mrs", "quiz-bg-yonezu", "quiz-bg-mahumahu", "quiz-bg-arashi", "quiz-bg-deco27", "quiz-bg-Kanaria", "quiz-bg-aina", "quiz-bg-pedro", "quiz-bg-all"); // 既存を削除
    if (selectedArtist === "Mrs. GREEN APPLE") {
      quizPanel.classList.add("quiz-bg-Mrs");
    } else if (selectedArtist === "米津玄師") {
      quizPanel.classList.add("quiz-bg-yonezu");
    } else if (selectedArtist === "嵐") {
      quizPanel.classList.add("quiz-bg-arashi");
    } else if (selectedArtist === "まふまふ") {
      quizPanel.classList.add("quiz-bg-mahumahu");
    } else if (selectedArtist === "DECO*27") {
      quizPanel.classList.add("quiz-bg-deco27");
    } else if (selectedArtist === "Kanaria") {
      quizPanel.classList.add("quiz-bg-Kanaria");
    } else if (selectedArtist === "アイナ・ジ・エンド") {
      quizPanel.classList.add("quiz-bg-aina");
    } else if (selectedArtist === "PEDRO") {
      quizPanel.classList.add("quiz-bg-pedro");
    } else if (selectedArtist === "全アーティスト") {
      quizPanel.classList.add("quiz-bg-all");
    }
  }

  //quiz表示処理
  function showQuestion() {
    const current = quizData[currentQuestionIndex];
    questionText.textContent = current.question;
    questionCounter.textContent = `${currentQuestionIndex + 1}問/${quizData.length}問`;

    // アーティスト名は表示しない
    const questionArtist = document.getElementById("question-artist");
    questionArtist.style.display = "none";

    feedback.textContent = "";
    startQuestionTimer();

    //不正解歌詞タイトル選択肢を作成
    const choices = document.getElementById("choices");
    choices.innerHTML = "";

    //正解歌詞タイトル表示
    const correctAnswer = current.answer;
    const otherOptions = quizData.map(q => q.answer).filter(a => a !== correctAnswer);
    shuffle(otherOptions);

    //選択肢の数指定
    const options = [correctAnswer, ...otherOptions.slice(0, 2)];
    shuffle(options);

    options.forEach(opt => {
      const btn = document.createElement("button");
      btn.textContent = opt;
      btn.className = "choice-button";
      btn.addEventListener("click", () => checkAnswer(opt));
      choices.appendChild(btn);
    });
  }

  function startQuestionTimer() {
    const timerBar = document.getElementById("timer-bar");
    const timerText = document.getElementById("timer-text");

    if (questionTimeout) clearInterval(questionTimeout);

    questionTimeLeft = timerLimit;
    updateTimerUI();

    questionTimeout = setInterval(() => {
      questionTimeLeft -= 0.1;
      if (questionTimeLeft <= 0) {
        questionTimeLeft = 0;
        updateTimerUI();
        clearInterval(questionTimeout);
        checkAnswer(null); // タイムアウト
      } else {
        updateTimerUI();
      }
    }, 100);
  }

  function updateTimerUI() {
    const timerBar = document.getElementById("timer-bar");
    const timerText = document.getElementById("timer-text");
    const percentage = (questionTimeLeft / timerLimit) * 100;
    timerBar.style.width = `${percentage}%`;
    timerText.textContent = `${Math.ceil(questionTimeLeft)}s`;
  }

  // 配列シャッフル
  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }


  function checkAnswer(selectedOption) {
    clearInterval(questionTimeout); // 問題ごとのタイマーを止める
    const correctAnswer = quizData[currentQuestionIndex].answer;
    if (selectedOption === correctAnswer) {
      correctCount++;
      const bonus = Math.ceil(questionTimeLeft);
      totalBonus += bonus;
      feedback.textContent = `正解！ +${10 + bonus}点（ボーナス ${bonus}点）`;
      feedback.style.color = "green";
    } else if (selectedOption === null) {
      feedback.textContent = `時間切れ！ 正解は「${correctAnswer}」でした。`;
      feedback.style.color = "orange";
    } else {
      feedback.textContent = `不正解… 正解は「${correctAnswer}」です。`;
      feedback.style.color = "red";
    }
    currentQuestionIndex++;
    if (currentQuestionIndex < quizData.length) {
      setTimeout(showQuestion, 2000);
    } else {
      setTimeout(() => {
        quizPanel.innerHTML = `
        <h2>クイズ終了！お疲れさまでした！</h2>
        <p>正解数：${correctCount}問</p>
        <p>基本スコア：${correctCount * 10}点</p>
        <p>タイムボーナス：${totalBonus}点</p>
        <p>最終スコア：${correctCount * 10 + totalBonus}点</p>
        <button id="showSongsButton">出題された曲を見る</button>

        <button id="restartButton">もう一度挑戦</button>
      `;

        document.getElementById("restartButton").addEventListener("click", () => {
          location.reload();
        });

        document.getElementById("showSongsButton").addEventListener("click", () => {
          quizPanel.style.display = "none";
          const songListPanel = document.getElementById("songListPanel");
          const songListContainer = document.getElementById("songListContainer");
          songListContainer.innerHTML = "";

          quizData.forEach(q => {
            const title = q.answer;
            const url = q.link || "#";
            const p = document.createElement("p");
            if (url === "#") {
              p.textContent = `🎵 ${title}（リンクなし）`;
            } else {
              p.innerHTML = `🎵 <a href="${url}" target="_blank">${title}</a>`;
            }
            songListContainer.appendChild(p);
          });

          songListPanel.style.display = "block";
        });
      }, 2000);
      // 「結果画面に戻る」ボタン
      document.getElementById("backToResult").addEventListener("click", () => {
        const songListPanel = document.getElementById("songListPanel");
        songListPanel.style.display = "none";
        quizPanel.style.display = "block";
      });
    }
  }

  // 戻るボタン処理
  document.getElementById("backToArtist").addEventListener("click", () => {
    difficultyPanel.style.display = "none";
    stopWatchPanel.style.display = "";
    artistTitle.style.display = 'block';
    artistSubtitle.style.display = 'block';
  });

  document.getElementById("backToDifficulty").addEventListener("click", () => {
    quizPanel.style.display = "none";
    difficultyPanel.style.display = "block";
  });

});