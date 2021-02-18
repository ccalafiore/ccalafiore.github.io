/**
 * jspsych plugin for categorization trials with feedback and animated stimuli
 * Josh de Leeuw
 *
 * documentation: docs.jspsych.org
 **/


jsPsych.plugins["categorize-animation-cc"] = (function() {

  var plugin = {};

  jsPsych.pluginAPI.registerPreload('categorize-animation-cc', 'stimuli', 'image');

  plugin.info = {
    name: 'categorize-animation-cc',
    description: '',
    parameters: {
      stimuli: {
        type: jsPsych.plugins.parameterType.IMAGE,
        pretty_name: 'Stimuli',
        default: undefined,
        description: 'Array of paths to image files.'
      },
      key_answer: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Key answer',
        default: undefined,
        description: 'The string of the key character to indicate correct response'
      },
      choices: {
        type: jsPsych.plugins.parameterType.KEYCODE,
        pretty_name: 'Choices',
        default: jsPsych.ALL_KEYS,
        array: true,
        description: 'The keys subject is allowed to press to respond to stimuli.'
      },
      correct_image: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Correct image',
        default: null,
        description: 'directory of the image to show when subject gives correct answer'
      },
      incorrect_image: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Incorrect image',
        default: null,
        description: 'directory of the image to show when subject gives incorrect answer.'
      },
      frame_time: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Frame time',
        default: 500,
        description: 'Duration to display each image.'
      },
      sequence_reps: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Sequence repetitions',
        default: 1,
        description: 'How many times to display entire sequence.'
      },
      allow_response_before_complete: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Allow response before complete',
        default: false,
        description: 'If true, subject can response before the animation sequence finishes'
      },
      opacity_stimuli: {
        type: jsPsych.plugins.parameterType.FLOAT,
        pretty_name: 'Opacity Stimuli',
        default: 1.0,
        description: 'The Opacity of the animation images to be displayed.'
      },
      stimulus_end: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Stimuli End',
        default: null,
        description: 'The image to be displayed at the of the animation.'
      },
      feedback: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Feedback',
        default: true,
        description: 'if true show feedback'
        },
      feedback_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Feedback duration',
        default: 2000,
        description: 'How long to show feedback'
      },
      prompt: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Prompt',
        default: null,
        description: 'Any content here will be displayed below the stimulus.'
      },
    }
  }

  plugin.trial = function(display_element, trial) {

    var animate_frame = -1;
    var reps = 0;

    var showAnimation = true;

    var responded = false;
    var timeoutSet = false;
    var correct;
    var key_press = null;

    // show animation
    var animate_interval = setInterval(function() {
      display_element.innerHTML = ''; // clear everything
      animate_frame++;
      if (animate_frame == trial.stimuli.length) {
        reps++;
        if (trial.sequence_reps == -1 || reps < trial.sequence_reps) {
          animate_frame = 0;
        } else {
          showAnimation = false;
        }
      }
      if (!responded) {
        if (showAnimation) {
          display_element.innerHTML += '<img src="' + trial.stimuli[animate_frame]+ '" id="jspsych-animation-image" style="opacity:' + trial.opacity_stimuli.toString() + ';"></img>';

        } else if (trial.stimulus_end === null) {
          display_element.innerHTML += '<img src="' + trial.stimuli[trial.stimuli.length - 1]+ '" id="jspsych-animation-image" style="opacity:' + trial.opacity_stimuli.toString() + ';"></img>';

        } else {
          // show "which action???"
          display_element.innerHTML = '<img src="' + trial.stimulus_end + '" id="jspsych-animation-image"></img>';

        }

        if (trial.prompt !== null) {
          display_element.innerHTML += trial.prompt;
        }

      } else if (trial.feedback) {
        // user has responded if we get here.

        // show feedback
        if (correct) {
          if (trial.correct_image === null) {
            display_element.innerHTML += 'Correct!'.fontcolor('Green').bold();
          } else {
            display_element.innerHTML = '<img src="' + trial.correct_image + '" id="jspsych-animation-image"></img>';
          }
        } else {
          if (trial.incorrect_image === null) {
            display_element.innerHTML += 'Incorrect!'.fontcolor('Red').bold();
          } else {
            display_element.innerHTML = '<img src="' + trial.incorrect_image + '" id="jspsych-animation-image"></img>';
          }
        }

        if (trial.prompt !== null) {
          display_element.innerHTML += trial.prompt;
        }

        // set timeout to clear feedback
        if (!timeoutSet) {
          timeoutSet = true;
          jsPsych.pluginAPI.setTimeout(function() {
            endTrial();
          }, trial.feedback_duration);
        }
      } else {
        // user has responded if we get here.
        endTrial()

      }
    }, trial.frame_time);


    var keyboard_listener;
    var trial_data = {};

    var after_response = function(info) {
      // ignore the response if animation is playing and subject
      // not allowed to respond before it is complete
      if (!trial.allow_response_before_complete && showAnimation) {
        return false;
      }

      jsPsych.pluginAPI.cancelKeyboardResponse(keyboard_listener);

      key_press = jsPsych.pluginAPI.convertKeyCodeToKeyCharacter(info.key);

      correct = Number(trial.key_answer === key_press);

      responded = true;

      trial_data = {
        //"stimulus": JSON.stringify(trial.stimuli),
        "rt": info.rt,
        "correct": correct,
        "key_press": key_press
      };

    }

    keyboard_listener = jsPsych.pluginAPI.getKeyboardResponse({
      callback_function: after_response,
      valid_responses: trial.choices,
      rt_method: 'performance',
      persist: true,
      allow_held_key: false
    });

    function endTrial() {
      jsPsych.pluginAPI.cancelKeyboardResponse(keyboard_listener);
      clearInterval(animate_interval); // stop animation!
      jsPsych.pluginAPI.clearAllTimeouts();
      display_element.innerHTML = ''; // clear everything
      jsPsych.finishTrial(trial_data);
    }
  };

  return plugin;
})();
