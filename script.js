/**
 * Interactive Storytelling — GoEast Mandarin
 * Click-based interactions, choices (A/B/C), and audio playback.
 * All paths are relative (images/, sounds/).
 */

(function () {
  'use strict';

  const scene = document.getElementById('scene');
  const storyText = document.getElementById('storyText');
  const choicesContainer = document.getElementById('choices');
  const mikaTooltip = document.getElementById('mikaTooltip');
  const mikaOptions = document.getElementById('mikaOptions');

  const mikaPromptBlock = document.getElementById('mikaPromptBlock');
  if (!scene || !storyText || !choicesContainer) return;

  var bgMusic = new Audio('sounds/sound-effects/Backgroundmusicexample.mp3');
  bgMusic.volume = 0.05;
  bgMusic.loop = true;
  var bgMusicStarted = false;
  function startBgMusic() {
    if (bgMusicStarted) return;
    bgMusicStarted = true;
    bgMusic.play().catch(function () {});
  }

  /**
   * Play a sound from sounds/ folder.
   * @param {string} filename - e.g. 'click.mp3'
   */
  function playSound(filename) {
    if (!filename) return;
    const audio = new Audio('sounds/' + filename);
    audio.play().catch(function () { /* ignore autoplay restrictions */ });
  }

  /**
   * Set story text and optionally play sound.
   */
  function updateStory(text, soundFile) {
    storyText.textContent = text;
    if (soundFile) playSound(soundFile);
  }

  /**
   * Handle choice button click (A, B, C).
   */
  function onChoice(choice) {
    const messages = {
      A: 'You chose A.',
      B: 'You chose B.',
      C: 'You chose C.'
    };
    updateStory(messages[choice] || 'You made a choice.', null);
    // Future: trigger different character actions/audio per choice
  }

  /**
   * Handle character/object click.
   */
  function onCharacterClick(name) {
    updateStory('You clicked on: ' + (name || 'the scene') + '.', null);
  }

  /**
   * Switch a character's image. Position and size stay fixed; only the image changes.
   * @param {string} characterId - id of the character container, e.g. 'mika', 'xiaotian'
   * @param {string} imageSrc - path to new image, e.g. 'images/Mika1.png'
   */
  function setCharacterImage(characterId, imageSrc) {
    const el = document.querySelector('#' + characterId + ' img');
    if (el && imageSrc) el.src = imageSrc;
  }

  // Expose for use by choice handlers or other logic
  window.setCharacterImage = setCharacterImage;

  // Choice buttons
  choicesContainer.querySelectorAll('.choice-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      onChoice(btn.getAttribute('data-choice'));
    });
  });

  // Mika: first click shows blue box, plays "Where is Mika.mp3"; when audio ends, show three pink options below
  let mikaTooltipShown = false;
  let mikaOptionRound = 1; // 1 = after first Mika click, 2 = after "Where is Xiaotian" played
  const mikaEl = document.getElementById('mika');
  if (mikaEl && mikaTooltip) {
    mikaEl.addEventListener('click', function (e) {
      e.stopPropagation();
      if (!mikaTooltipShown) {
        mikaTooltipShown = true;
        var startBox = document.getElementById('startPromptBox');
        if (startBox) startBox.classList.add('is-hidden');
        startBgMusic();
        if (mikaPromptBlock) mikaPromptBlock.classList.add('is-visible');
        var audio = new Audio('sounds/Where is Mika.mp3');
        audio.volume = 1;
        audio.play().catch(function () {});
        audio.addEventListener('ended', function onEnded() {
          audio.removeEventListener('ended', onEnded);
          if (mikaOptions) {
            mikaOptions.classList.add('is-visible');
            mikaOptions.setAttribute('aria-hidden', 'false');
          }
          if (mikaPromptBlock) mikaPromptBlock.classList.add('has-options');
        });
      } else {
        onCharacterClick('mika');
      }
    });
  }

  // Other character clicks (characters stay in place; use setCharacterImage to change pose)
  scene.querySelectorAll('.character[data-character]').forEach(function (character) {
    if (character.id === 'mika') return;
    character.addEventListener('click', function (e) {
      e.stopPropagation();
      onCharacterClick(character.getAttribute('data-character'));
    });
  });

  // Click on scene background
  scene.addEventListener('click', function (e) {
    if (e.target.classList.contains('scene-inner')) {
      onCharacterClick('scene');
    }
  });

  // Mika option buttons: 你好！ and 你做什么？ = wrong (red + audio), 你在哪里？ = correct (green + twinkle)
  if (mikaOptions) {
    mikaOptions.querySelectorAll('.mika-option-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.getAttribute('data-mika');
        if (key === 'hello') {
          btn.classList.add('wrong');
          var audio = new Audio('sounds/你好 (option).mp3');
          audio.volume = 1;
          audio.play().catch(function () {});
        } else if (key === 'do') {
          btn.classList.add('wrong');
          var audio = new Audio('sounds/你做什么？.mp3');
          audio.volume = 1;
          audio.play().catch(function () {});
        } else if (key === 'where') {
          btn.classList.add('correct');
          var sparkle = new Audio('sounds/sound-effects/twinklesparkle.mp3');
          sparkle.volume = 0.8;
          sparkle.play().catch(function () {});
          window.setTimeout(function () {
            var block = document.getElementById('mikaPromptBlock');
            var responseBox = document.getElementById('mikaResponseBox');
            if (block) block.classList.add('show-response');
            if (responseBox) responseBox.classList.remove('replaced');
            if (responseBox) {
              if (mikaOptionRound === 2) {
                setCharacterImage('mika', 'images/Mika1.png');
                var mikaBubble = document.getElementById('mikaSpeechBubble');
                if (mikaBubble) {
                  mikaBubble.classList.remove('is-visible');
                  mikaBubble.setAttribute('aria-hidden', 'true');
                }
                window.setTimeout(function () {
                  setCharacterImage('xiaotian', 'images/Xiaotian2.png');
                  var xb = document.getElementById('xiaotianSpeechBubble');
                  if (xb) {
                    xb.classList.add('is-visible');
                    xb.setAttribute('aria-hidden', 'false');
                  }
                  var xiaotianAlsoHome = new Audio('sounds/小天：我也在家里.mp3');
                  xiaotianAlsoHome.volume = 1;
                  xiaotianAlsoHome.play().catch(function () {});
                }, 1500);
              } else if (mikaOptionRound === 1) {
                var reply = new Audio('sounds/你在哪里啊.mp3');
                reply.volume = 1;
                reply.play().catch(function () {});
                reply.addEventListener('ended', function onReplyEnded() {
                  reply.removeEventListener('ended', onReplyEnded);
                  window.setTimeout(function () {
                    setCharacterImage('mika', 'images/Mika1.png');
                    window.setTimeout(function () {
                      setCharacterImage('mika', 'images/Mika2.png');
                      setCharacterImage('xiaotian', 'images/Xiaotian1.png');
                      var bubble = document.getElementById('mikaSpeechBubble');
                      if (bubble) {
                        bubble.classList.add('is-visible');
                        bubble.setAttribute('aria-hidden', 'false');
                      }
                      var a1 = new Audio('sounds/我在家里1.mp3');
                      a1.volume = 0.8;
                      a1.play().catch(function () {});
                      a1.addEventListener('ended', function on1Ended() {
                        a1.removeEventListener('ended', on1Ended);
                        var a2 = new Audio('sounds/I\'m at home.mp3');
                        a2.volume = 0.8;
                        a2.play().catch(function () {});
                        a2.addEventListener('ended', function on2Ended() {
                          a2.removeEventListener('ended', on2Ended);
                          var a3 = new Audio('sounds/我在家里2.mp3');
                          a3.volume = 0.8;
                          a3.play().catch(function () {});
                          a3.addEventListener('ended', function on3Ended() {
                            a3.removeEventListener('ended', on3Ended);
                            setCharacterImage('mika', 'images/Mika1.png');
                            window.setTimeout(function () {
                              var rb = document.getElementById('mikaResponseBox');
                              if (rb) rb.classList.add('replaced');
                              var xiaotianBox = document.getElementById('xiaotianPromptBox');
                              if (xiaotianBox) {
                                xiaotianBox.classList.add('is-visible');
                                xiaotianBox.setAttribute('aria-hidden', 'false');
                              }
                              var xiaotianAudio = new Audio('sounds/Where is Xiaotian.mp3');
                              xiaotianAudio.volume = 1;
                              xiaotianAudio.play().catch(function () {});
                              xiaotianAudio.addEventListener('ended', function onXiaotianEnded() {
                                xiaotianAudio.removeEventListener('ended', onXiaotianEnded);
                                mikaOptionRound = 2;
                                var opts = mikaOptions ? mikaOptions.querySelectorAll('.mika-option-btn') : [];
                                opts.forEach(function (b) {
                                  b.classList.remove('correct', 'wrong');
                                });
                                var xb = document.getElementById('xiaotianPromptBox');
                                if (xb) xb.classList.remove('is-visible');
                                if (mikaPromptBlock) mikaPromptBlock.classList.remove('show-response');
                                if (mikaOptions) {
                                  mikaOptions.classList.add('is-visible');
                                  mikaOptions.setAttribute('aria-hidden', 'false');
                                }
                                if (mikaPromptBlock) mikaPromptBlock.classList.add('has-options');
                              });
                            }, 2000);
                          });
                        });
                      });
                    }, 1000);
                  }, 1000);
                });
              }
            }
          }, 1000);
        }
      });
    });
  }
})();
