/**
 * jsPsych plugin for showing animations and recording keyboard responses
 * Josh de Leeuw
 *
 * documentation: docs.jspsych.org
 */
 
 //changes made by TF for CC
 //1. end trial after first response
 //2. show "response screen" (or final frame?) when animation finishes
 //3. add any data?


jsPsych.plugins.animationcc = (function() {

  var plugin = {};

  jsPsych.pluginAPI.registerPreload('animationcc', 'stimuli', 'image');

  plugin.info = {
    name: 'animationcc',
    description: '',
    parameters: {
      stimuli: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Stimuli',
        default: undefined,
        array: true,
        description: 'The images to be displayed.'
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

      opacity_stimulus_end: {
        type: jsPsych.plugins.parameterType.FLOAT,
        pretty_name: 'Opacity Stimuli End',
        default: 1.0,
        description: 'The Opacity of the image to be displayed at the of the animation.'
      },


      frame_time: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Frame time',
        default: 250,
        description: 'Duration to display each image.'
      },
      frame_isi: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Frame gap',
        default: 0,
        description: 'Length of gap to be shown between each image.'
      },
      sequence_reps: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Sequence repetitions',
        default: 1,
        description: 'Number of times to show entire sequence.'
      },
      choices: {
        type: jsPsych.plugins.parameterType.KEYCODE,
        pretty_name: 'Choices',
        default: jsPsych.ALL_KEYS,
        array: true,
        description: 'Keys subject uses to respond to stimuli.'
      },
      prompt: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Prompt',
        default: null,
        description: 'Any content here will be displayed below stimulus.'
      }
    }
  }

  plugin.trial = function(display_element, trial) {

    var interval_time = trial.frame_time + trial.frame_isi;
    var animate_frame = -1;
    var reps = 0;
    var startTime = performance.now();
    var key_press = null
    var rt = null
//    var animation_sequence = [];
//    var responses = [];
//    var current_stim = "";
    var showImageEnd = false;

    var animate_interval = setInterval(function() {
      var showImage = true;

      display_element.innerHTML = ''; // clear everything
      animate_frame++;
      if (animate_frame >= trial.stimuli.length) {

        reps++;
        if (reps < trial.sequence_reps) {
          animate_frame = 0;
        } else if (trial.stimulus_end == null) {
          //showImageEnd = false;
          animate_frame = trial.stimuli.length - 1;
          //endTrial(); //no longer end when we are done
          clearInterval(animate_interval);
          //showImage = false;
        } else {
          showImageEnd = true;
          clearInterval(animate_interval);

        }
      }
      if (showImage) {
        show_next_frame();
      }
    }, interval_time);

    function show_next_frame() {
      // show image
      if (showImageEnd) {
        display_element.innerHTML = '<img src="'+ trial.stimulus_end + '" id="jspsych-end-image" style="opacity:' + trial.opacity_stimulus_end.toString() + ';"></img>';

        current_stim = trial.stimulus_end;

        // record when image was shown
        //animation_sequence.push({
          //"stimulus": trial.stimulus_end,
          //"time": performance.now() - startTime
        //});


      } else {
        display_element.innerHTML = '<img src="'+ trial.stimuli[animate_frame]+'" id="jspsych-animation-image" style="opacity:' + trial.opacity_stimuli.toString() + ';"></img>';

        current_stim = trial.stimuli[animate_frame];

        // record when image was shown
        //animation_sequence.push({
          //"stimulus": trial.stimuli[animate_frame],
          //"time": performance.now() - startTime
        //});

      }




      if (trial.prompt !== null) {
        display_element.innerHTML += trial.prompt;
      }

      if (trial.frame_isi > 0) {
        jsPsych.pluginAPI.setTimeout(function() {
          display_element.querySelector('#jspsych-animation-image').style.visibility = 'hidden';
          current_stim = 'blank';
          // record when blank image was shown
          //animation_sequence.push({
            //"stimulus": 'blank',
            //"time": performance.now() - startTime
          //});
        }, trial.frame_time);
      }
    }

    var after_response = function(info) {

//      responses.push({
//        key_press: info.key,
//        rt: info.rt,
//        stimulus: current_stim
//      });
      //key_press = Number(info.key)
      //rt = Number(info.rt)
      key_press = jsPsych.pluginAPI.convertKeyCodeToKeyCharacter(info.key)
      rt = info.rt

      // after a valid response, the stimulus will have the CSS class 'responded'
      // which can be used to provide visual feedback that a response was recorded
      display_element.querySelector('#jspsych-animation-image').className += ' responded';
      
      endTrial();
    }

    // hold the jspsych response listener object in memory
    // so that we can turn off the response collection when
    // the trial ends
    var response_listener = jsPsych.pluginAPI.getKeyboardResponse({
      callback_function: after_response,
      valid_responses: trial.choices,
      rt_method: 'performance',
      persist: true,
      allow_held_key: false
    });

    function endTrial() {

      jsPsych.pluginAPI.cancelKeyboardResponse(response_listener);
      // kill any remaining setTimeout handlers
      clearInterval(animate_interval);
      jsPsych.pluginAPI.clearAllTimeouts();

      var trial_data = {
        //"animation_sequence": JSON.stringify(animation_sequence),
        //"key_press": JSON.stringify(key_press),
        //"rt": JSON.stringify(rt),
        "key_press": key_press,
        "rt": rt,
//        "responses": JSON.stringify(responses)

      };
      display_element.innerHTML = '';

      jsPsych.finishTrial(trial_data);
    }
  };

  return plugin;
})();
