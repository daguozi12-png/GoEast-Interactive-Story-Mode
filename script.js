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
  const mikaEl = document.getElementById('mika');
  if (mikaEl && mikaTooltip) {
    mikaEl.addEventListener('click', function (e) {
      e.stopPropagation();
      if (!mikaTooltipShown) {
        mikaTooltipShown = true;
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
          var sparkle = new Audio('sounds/Sound effects/twinklesparkle.mp3');
          sparkle.volume = 1;
          sparkle.play().catch(function () {});
          window.setTimeout(function () {
            var block = document.getElementById('mikaPromptBlock');
            var responseBox = document.getElementById('mikaResponseBox');
            if (block) block.classList.add('show-response');
            if (responseBox) {
              var reply = new Audio('sounds/你在哪里啊.mp3');
              reply.volume = 1;
              reply.play().catch(function () {});
            }
          }, 1000);
        }
      });
    });
  }
})();
