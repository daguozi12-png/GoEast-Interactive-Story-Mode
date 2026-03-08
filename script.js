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
  bgMusic.volume = 0.04;
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

  // Double-click on scene: skip current step (advance immediately, stop audio/timeouts)
  var skipState = { audio: null, timeoutIds: [], callback: null };
  function clearSkip() {
    if (skipState.timeoutIds.length) {
      skipState.timeoutIds.forEach(function (id) { clearTimeout(id); });
      skipState.timeoutIds = [];
    }
    if (skipState.audio) {
      try { skipState.audio.pause(); skipState.audio.currentTime = 0; } catch (err) {}
      skipState.audio = null;
    }
    skipState.callback = null;
  }
  function registerSkip(audio, callback, timeoutIds) {
    if (!timeoutIds) timeoutIds = [];
    skipState.audio = audio;
    skipState.timeoutIds = timeoutIds;
    skipState.callback = callback;
  }
  function runSkip() {
    if (!skipState.callback) return;
    var fn = skipState.callback;
    clearSkip();
    fn();
  }
  function onSceneDoubleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    runSkip();
  }
  if (scene) {
    scene.addEventListener('dblclick', onSceneDoubleClick);
  }
  var pageWrapper = document.querySelector('.page-wrapper');
  if (pageWrapper) {
    pageWrapper.addEventListener('dblclick', onSceneDoubleClick);
  }

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
        function showOptionsAfterMika() {
          if (mikaOptions) {
            mikaOptions.classList.add('is-visible');
            mikaOptions.setAttribute('aria-hidden', 'false');
          }
          if (mikaPromptBlock) mikaPromptBlock.classList.add('has-options');
        }
        registerSkip(audio, showOptionsAfterMika);
        audio.addEventListener('ended', function onEnded() {
          audio.removeEventListener('ended', onEnded);
          clearSkip();
          showOptionsAfterMika();
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
          sparkle.volume = 0.3;
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
                var reply2 = new Audio('sounds/你在哪里啊.mp3');
                reply2.volume = 1;
                reply2.play().catch(function () {});
                function doAfterReply2() {
                  setCharacterImage('xiaotian', 'images/Xiaotian2.png');
                  var xb = document.getElementById('xiaotianSpeechBubble');
                  if (xb) {
                    xb.classList.add('is-visible');
                    xb.setAttribute('aria-hidden', 'false');
                  }
                  var xiaotianAlsoHome = new Audio('sounds/小天：我也在家里.mp3');
                  xiaotianAlsoHome.volume = 0.7;
                  xiaotianAlsoHome.play().catch(function () {});
                  function doAfterXiaotianAlsoHome() {
                    setCharacterImage('xiaotian', 'images/Xiaotian1.png');
                    var mikaBubbleEl = document.getElementById('mikaSpeechBubble');
                    var chineseSpan = mikaBubbleEl ? mikaBubbleEl.querySelector('.mika-speech-chinese') : null;
                    var pinyinSpan = mikaBubbleEl ? mikaBubbleEl.querySelector('.mika-speech-pinyin') : null;
                    if (chineseSpan) chineseSpan.textContent = '小天也在家里';
                    if (pinyinSpan) pinyinSpan.textContent = 'xiǎo tiān yě zài jiā lǐ';
                    var xiaotianBubble = document.getElementById('xiaotianSpeechBubble');
                    if (xiaotianBubble) {
                      xiaotianBubble.classList.remove('is-visible');
                      xiaotianBubble.setAttribute('aria-hidden', 'true');
                    }
                    if (mikaBubbleEl) {
                      mikaBubbleEl.classList.add('is-visible');
                      mikaBubbleEl.setAttribute('aria-hidden', 'false');
                    }
                    setCharacterImage('mika', 'images/Mika2.png');
                    var mikaXiaotianAtHome = new Audio('sounds/小天也在家里.mp3');
                    mikaXiaotianAtHome.volume = 0.7;
                    mikaXiaotianAtHome.play().catch(function () {});
                    mikaXiaotianAtHome.addEventListener('ended', function onFirstEnded() {
                      mikaXiaotianAtHome.removeEventListener('ended', onFirstEnded);
                      mikaXiaotianAtHome.currentTime = 0;
                      mikaXiaotianAtHome.play().catch(function () {});
                      mikaXiaotianAtHome.addEventListener('ended', function onMikaXiaotianEnded() {
                        mikaXiaotianAtHome.removeEventListener('ended', onMikaXiaotianEnded);
                        window.setTimeout(function () {
                          if (mikaBubbleEl) mikaBubbleEl.classList.add('fade-out');
                          window.setTimeout(function () {
                            if (mikaBubbleEl) {
                              mikaBubbleEl.classList.remove('is-visible', 'fade-out');
                              mikaBubbleEl.setAttribute('aria-hidden', 'true');
                            }
                            setCharacterImage('mika', 'images/Mika1.png');
                            var xbEl = document.getElementById('xiaotianSpeechBubble');
                            var respBox = document.getElementById('mikaResponseBox');
                            var sceneCat = document.getElementById('sceneCat');
                            var sceneBooks = document.getElementById('sceneBooks');
                            var sceneBasketball = document.getElementById('sceneBasketball');
                            if (sceneCat) { sceneCat.classList.add('is-visible', 'objects-locked'); sceneCat.setAttribute('aria-hidden', 'false'); }
                            if (sceneBooks) { sceneBooks.classList.add('is-visible', 'objects-locked'); sceneBooks.setAttribute('aria-hidden', 'false'); }
                            if (sceneBasketball) { sceneBasketball.classList.add('is-visible', 'objects-locked'); sceneBasketball.setAttribute('aria-hidden', 'false'); }
                            window.setTimeout(function () {
                              var objectsBox = document.getElementById('objectsPromptBox');
                              if (objectsBox) {
                                objectsBox.classList.add('is-visible');
                                objectsBox.setAttribute('aria-hidden', 'false');
                              }
                              var objectsAudio = new Audio('sounds/objects.mp3');
                              objectsAudio.volume = 1;
                              objectsAudio.play().catch(function () {});
                              function enableObjectClicks() {
                                if (sceneCat) sceneCat.classList.remove('objects-locked');
                                if (sceneBooks) sceneBooks.classList.remove('objects-locked');
                                if (sceneBasketball) sceneBasketball.classList.remove('objects-locked');
                              }
                              registerSkip(objectsAudio, enableObjectClicks);
                              objectsAudio.addEventListener('ended', function onObjectsAudioEnded() {
                                objectsAudio.removeEventListener('ended', onObjectsAudioEnded);
                                clearSkip();
                                enableObjectClicks();
                              });
                            }, 2000);
                            if (xbEl) xbEl.classList.add('fade-out');
                            if (respBox) respBox.classList.add('fade-out');
                            window.setTimeout(function () {
                              if (xbEl) {
                                xbEl.classList.remove('is-visible', 'fade-out');
                                xbEl.setAttribute('aria-hidden', 'true');
                              }
                              if (respBox) {
                                respBox.classList.remove('fade-out');
                                respBox.classList.add('replaced');
                              }
                            }, 500);
                          }, 500);
                        }, 2000);
                      });
                    });
                  }
                  registerSkip(xiaotianAlsoHome, doAfterXiaotianAlsoHome);
                  xiaotianAlsoHome.addEventListener('ended', function onXiaotianAlsoHomeEnded() {
                    xiaotianAlsoHome.removeEventListener('ended', onXiaotianAlsoHomeEnded);
                    clearSkip();
                    window.setTimeout(doAfterXiaotianAlsoHome, 2000);
                  });
                }
                var t4 = window.setTimeout(function () {
                  clearSkip();
                  doAfterReply2();
                }, 4000);
                registerSkip(reply2, doAfterReply2, [t4]);
                reply2.addEventListener('ended', function onReply2Ended() {
                  reply2.removeEventListener('ended', onReply2Ended);
                  clearSkip();
                  window.setTimeout(doAfterReply2, 4000);
                });
              } else if (mikaOptionRound === 1) {
                var reply = new Audio('sounds/你在哪里啊.mp3');
                reply.volume = 1;
                reply.play().catch(function () {});
                function doAfterReply() {
                  setCharacterImage('mika', 'images/Mika1.png');
                  setCharacterImage('mika', 'images/Mika2.png');
                  setCharacterImage('xiaotian', 'images/Xiaotian1.png');
                  var bubble = document.getElementById('mikaSpeechBubble');
                  if (bubble) {
                    bubble.classList.add('is-visible');
                    bubble.setAttribute('aria-hidden', 'false');
                  }
                  var a1 = new Audio('sounds/我在家里1.mp3');
                  a1.volume = 0.48;
                  a1.play().catch(function () {});
                  function doAfterA1() {
                    var a2 = new Audio('sounds/I\'m at home.mp3');
                    a2.volume = 0.48;
                    a2.play().catch(function () {});
                    function doAfterA2() {
                      var a3 = new Audio('sounds/我在家里2.mp3');
                      a3.volume = 0.48;
                      a3.play().catch(function () {});
                      function doAfterA3() {
                        setCharacterImage('mika', 'images/Mika1.png');
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
                        function doAfterXiaotianAudio() {
                          mikaOptionRound = 2;
                          if (mikaTooltip) mikaTooltip.textContent = 'Where are you, Xiaotian?';
                          var opts = mikaOptions ? mikaOptions.querySelectorAll('.mika-option-btn') : [];
                          opts.forEach(function (b) { b.classList.remove('correct', 'wrong'); });
                          var xb = document.getElementById('xiaotianPromptBox');
                          if (xb) xb.classList.remove('is-visible');
                          if (mikaPromptBlock) mikaPromptBlock.classList.remove('show-response');
                          if (mikaOptions) {
                            mikaOptions.classList.add('is-visible');
                            mikaOptions.setAttribute('aria-hidden', 'false');
                          }
                          if (mikaPromptBlock) mikaPromptBlock.classList.add('has-options');
                        }
                        registerSkip(xiaotianAudio, doAfterXiaotianAudio);
                        xiaotianAudio.addEventListener('ended', function onXiaotianEnded() {
                          xiaotianAudio.removeEventListener('ended', onXiaotianEnded);
                          clearSkip();
                          doAfterXiaotianAudio();
                        });
                      }
                      registerSkip(a3, doAfterA3);
                      a3.addEventListener('ended', function on3Ended() {
                        a3.removeEventListener('ended', on3Ended);
                        clearSkip();
                        window.setTimeout(doAfterA3, 2000);
                      });
                    }
                    registerSkip(a2, doAfterA2);
                    a2.addEventListener('ended', function on2Ended() {
                      a2.removeEventListener('ended', on2Ended);
                      clearSkip();
                      doAfterA2();
                    });
                  }
                  registerSkip(a1, doAfterA1);
                  a1.addEventListener('ended', function on1Ended() {
                    a1.removeEventListener('ended', on1Ended);
                    clearSkip();
                    doAfterA1();
                  });
                }
                registerSkip(reply, doAfterReply);
                reply.addEventListener('ended', function onReplyEnded() {
                  reply.removeEventListener('ended', onReplyEnded);
                  clearSkip();
                  window.setTimeout(doAfterReply, 1000);
                });
              }
            }
          }, 1000);
        }
      });
    });
  }

  // Scene objects (cat, books, basketball): click to hear Mika say the name
  var sceneCatEl = document.getElementById('sceneCat');
  var sceneBooksEl = document.getElementById('sceneBooks');
  var sceneBasketballEl = document.getElementById('sceneBasketball');
  var mikaSpeechBubbleEl = document.getElementById('mikaSpeechBubble');
  var objectReactionLock = false;
  var objectBubbleCount = 0;
  var currentObjectReaction = null;

  function cancelCurrentObjectReaction() {
    if (!currentObjectReaction) return;
    if (currentObjectReaction.timeoutId != null) clearTimeout(currentObjectReaction.timeoutId);
    if (currentObjectReaction.secondAudio) {
      try { currentObjectReaction.secondAudio.pause(); currentObjectReaction.secondAudio.currentTime = 0; } catch (err) {}
    }
    clearSkip();
    setCharacterImage('mika', 'images/Mika1.png');
    if (mikaSpeechBubbleEl) {
      mikaSpeechBubbleEl.classList.remove('is-visible');
      mikaSpeechBubbleEl.setAttribute('aria-hidden', 'true');
    }
    objectReactionLock = false;
    currentObjectReaction = null;
  }

  function showObjectReaction(firstAudioPath, chinese, pinyin, secondAudioPath, sourceElement) {
    if (objectReactionLock && currentObjectReaction && sourceElement !== currentObjectReaction.element) {
      cancelCurrentObjectReaction();
    }
    if (objectReactionLock) return;
    objectReactionLock = true;
    currentObjectReaction = { element: sourceElement, secondAudio: null, timeoutId: null };
    var firstAudio = new Audio(firstAudioPath);
    firstAudio.volume = 1;
    firstAudio.play().catch(function () {});
    function doAfterFirstObjectAudio() {
      objectBubbleCount += 1;
      var isThirdBubble = (objectBubbleCount >= 3);
      setCharacterImage('mika', 'images/Mika2.png');
      var chSpan = mikaSpeechBubbleEl ? mikaSpeechBubbleEl.querySelector('.mika-speech-chinese') : null;
      var pinyinSpan = mikaSpeechBubbleEl ? mikaSpeechBubbleEl.querySelector('.mika-speech-pinyin') : null;
      if (chSpan) chSpan.textContent = chinese;
      if (pinyinSpan) pinyinSpan.textContent = pinyin;
      if (mikaSpeechBubbleEl) {
        mikaSpeechBubbleEl.classList.remove('fade-out');
        mikaSpeechBubbleEl.classList.add('is-visible');
        mikaSpeechBubbleEl.setAttribute('aria-hidden', 'false');
      }
      var secondAudio = new Audio(secondAudioPath);
      secondAudio.volume = 1;
      secondAudio.play().catch(function () {});
      if (currentObjectReaction) currentObjectReaction.secondAudio = secondAudio;
      secondAudio.addEventListener('ended', function onSecondFirstEnded() {
        secondAudio.removeEventListener('ended', onSecondFirstEnded);
        window.setTimeout(function () {
          secondAudio.currentTime = 0;
          secondAudio.play().catch(function () {});
        }, 1000);
      });
      function doAfterObjectBubble() {
        if (currentObjectReaction && currentObjectReaction.timeoutId != null) {
          currentObjectReaction.timeoutId = null;
        }
        setCharacterImage('mika', 'images/Mika1.png');
        if (mikaSpeechBubbleEl) {
          mikaSpeechBubbleEl.classList.remove('is-visible');
          mikaSpeechBubbleEl.setAttribute('aria-hidden', 'true');
        }
        objectReactionLock = false;
        currentObjectReaction = null;
      }
      if (isThirdBubble) {
        var t10 = window.setTimeout(doAfterObjectBubble, 10000);
        if (currentObjectReaction) currentObjectReaction.timeoutId = t10;
        registerSkip(secondAudio, doAfterObjectBubble, [t10]);
      } else {
        registerSkip(secondAudio, doAfterObjectBubble);
      }
    }
    registerSkip(firstAudio, doAfterFirstObjectAudio);
    firstAudio.addEventListener('ended', function onFirstEnded() {
      firstAudio.removeEventListener('ended', onFirstEnded);
      clearSkip();
      doAfterFirstObjectAudio();
    });
  }

  if (sceneBooksEl) {
    sceneBooksEl.addEventListener('click', function (e) {
      e.stopPropagation();
      if (!sceneBooksEl.classList.contains('is-visible')) return;
      showObjectReaction('sounds/这是什么1.mp3', '这是一本书', 'zhè shì yī běn shū', 'sounds/1_这是一本书.mp3', sceneBooksEl);
    });
  }
  if (sceneCatEl) {
    sceneCatEl.addEventListener('click', function (e) {
      e.stopPropagation();
      if (!sceneCatEl.classList.contains('is-visible')) return;
      showObjectReaction('sounds/这是什么2.mp3', '这是一只猫', 'zhè shì yī zhī māo', 'sounds/这是一只猫.mp3', sceneCatEl);
    });
  }
  if (sceneBasketballEl) {
    sceneBasketballEl.addEventListener('click', function (e) {
      e.stopPropagation();
      if (!sceneBasketballEl.classList.contains('is-visible')) return;
      showObjectReaction('sounds/这是什么1.mp3', '这是一个球', 'zhè shì yī gè qiú', 'sounds/这是一个球.mp3', sceneBasketballEl);
    });
  }
})();
