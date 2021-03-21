/**
 * jspsych plugin for categorization trials with feedback and animated stimuli
 * Josh de Leeuw
 *
 * documentation: docs.jspsych.org
 **/


jsPsych.plugins["select-view-and-categorize-multi-view-video"] = (function() {

  var plugin = {};

  jsPsych.pluginAPI.registerPreload('select-view-and-categorize-multi-view-video', 'directories_mvv', 'image');

  plugin.info = {
    name: 'select-view-and-categorize-multi-view-video',
    description: '',
    parameters: {
      directories_mvv: {
        type: jsPsych.plugins.parameterType.IMAGE,
        pretty_name: 'directories_mvv',
        default: undefined,
        description: 'Directories_mvv of Multi-View Video with shape [J, I, T].'
      },
      view: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'View',
        default: undefined,
        description: 'Starting View. view[0]=j and view[1]=i. j is the j_th theta. i is the i_th phi.'
      },
      M: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'M movements',
        default: undefined,
        description: 'M[0] is the number of movements allowed in the move-to-play phase.' +
                     'M[1] is the number of movements allowed in the playing phase'
      },
      key_class: {
        type: jsPsych.plugins.parameterType.KEY,
        pretty_name: 'Key Classification',
        default: undefined,
        description: 'The key character to indicate correct classification'
      },
      choices_classes: {
        type: jsPsych.plugins.parameterType.KEY,
        pretty_name: 'Class Choices',
        default: jsPsych.ALL_KEYS,
        array: true,
        description: 'The keys subject is allowed to press to classify the stimuli.'
      },
      choices_movements: {
        type: jsPsych.plugins.parameterType.KEY,
        pretty_name: 'Movement Choices',
        default: ['leftarrow', 'rightarrow', 'downarrow', 'uparrow'],
        array: true,
        description: 'The keys [key_left, key_right, key_down, key_up] subject is allowed to press to move their view.'
      },
      type_of_movements: {
        type: jsPsych.plugins.parameterType.KEY,
        pretty_name: 'Type of Movements',
        default: 'c',
        array: true,
        description: 'The type of movements which could either be "c" for controlled or r for random.'
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
      allow_classification_in_move_to_play: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Allow classification in the move-to-play phase',
        default: false,
        description: 'If true, subject can response during the move-to-play phase'
      },
      allow_classification_in_playing: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Allow classification in the playing phase',
        default: true,
        description: 'If true, subject can response during the playing phase'
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
      render_on_canvas: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Render on canvas',
        default: true,
        description: 'If true, the images will be drawn onto a canvas element (prevents blank screen between consecutive images in some browsers).'+
          'If false, the image will be shown via an img element.'
      }
    }
  }

  plugin.trial = function(display_element, trial) {

    //jsPsych.pluginAPI.preloadImages(trial.directories_mvv)

    if (trial.render_on_canvas) {
      // first clear the display element (because the render_on_canvas method appends to display_element instead of overwriting it with .innerHTML)
      if (display_element.hasChildNodes()) {
        // can't loop through child list because the list will be modified by .removeChild()
        while (display_element.firstChild) {
          display_element.removeChild(display_element.firstChild);
        }
      }
      var canvas = document.createElement('canvas');
      canvas.id = 'jspsych-select-view-and-categorize-multi-view-video-stimuli';
      canvas.style.margin = 0;
      canvas.style.padding = 0;
      display_element.insertBefore(canvas, null);
      var ctx = canvas.getContext('2d');


      var img = new Image();
      img.src = trial.directories_mvv[0][0][0];
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      var center_x_canvas = canvas.width / 2;
      var center_y_canvas = canvas.height / 2;

      if (trial.prompt !== null) {
        var prompt_div = document.createElement('div');
        prompt_div.id = 'jspsych-select-view-and-categorize-multi-view-video-prompt';
        prompt_div.style.visibility = 'visible';
        prompt_div.innerHTML = trial.prompt;
        display_element.insertBefore(prompt_div, canvas.nextElementSibling);
      }
      //var feedback_div = document.createElement('div');
      //display_element.insertBefore(feedback_div, display_element.nextElementSibling);
    }

    trial.opacity_stimuli = Number(trial.opacity_stimuli)


    var J = trial.directories_mvv.length;
    var I = trial.directories_mvv[0].length;
    var T = trial.directories_mvv[0][0].length;

    var j = trial.view[0];
    var i = trial.view[1];
    var t = 0;

    var j_old = j;
    var i_old = i;
    var t_old = t;

    var delta = 0;
    var lambda = 0;

    var dir_jit;

    var reps = 0;

    var showAnimation = true;

    var responded = false;
    var timeoutSet = false;
    var correct;
    var key_press = null;

//    var pad_thetas = '00';
//    var pad_phis = '00';
//    var pad_times = "0000";

    var key_left = trial.choices_movements[0];
    var key_right = trial.choices_movements[1];
    var key_down = trial.choices_movements[2];
    var key_up = trial.choices_movements[3];

    var choices_movements = []
    if ((key_left !== null) && (key_left !== 'none') && (key_left !== 'None') && (key_left !== 'NONE')) {
      choices_movements.push(key_left);
    }
    if ((key_right !== null) && (key_right !== 'none') && (key_right !== 'None') && (key_right !== 'NONE')) {
      choices_movements.push(key_right);
    }
    if ((key_down !== null) && (key_down !== 'none') && (key_down !== 'None') && (key_down !== 'NONE')) {
      choices_movements.push(key_down);
    }
    if ((key_up !== null) && (key_up !== 'none') && (key_up !== 'None') && (key_up !== 'NONE')) {
      choices_movements.push(key_up);
    }


    var M0 = trial.M[0];      // maximum number of movements in the move-to-play phase
    var M1 = trial.M[1];      // maximum number of movements in the playing phase
    var m0 = -1;
    var m1 = -1;

    if (M0 === -1 ) {
      var move_to_play = true;
    } else {
      var move_to_play = m0 < (M0 - 1);
    }
    var playing = !move_to_play;

    if (M1 === -1 ) {
      var movable_in_playing = true;
    } else {
      var movable_in_playing = m1 < (M1 - 1);
    }

    //var time_changed = true

    var movable = move_to_play || (playing && movable_in_playing);

    var moved = false;

    var movements_times = [];

    var phases_times = [];
    //if (move_to_play) {
    //  var phases_times = [0]
    //} else if (playing) {
    //  var phases_times = [1]
    //}


    var frames = [t];
    var thetas_views = [j];
    var phis_views = [i];

    var deltas = [];
    var lambdas = [];

    var RT_movements = [];
    var RT_m = 'None';

    var m = 0;
    var m_old = m;
    var n_movements = m;


    var reps_times = [reps];

    var times = [0];
    var time_start = performance.now();

    // show animation
    var animate_interval = setInterval(function() {

      if (!trial.render_on_canvas) {
        display_element.innerHTML = ''; // clear everything
      }

      if (!responded) {
        if (showAnimation) {
        //if (time_changed) {
          j_old = j;
          i_old = i;
          t_old = t;
          m_old = m;
          if (delta !== 0) {

            j += delta
            if (j >= J) {
              j -= J;
            } else if (j < 0) {
              j += J;
            }
            moved = true;
          }
          if (lambda !== 0) {
            i += lambda;
            if (i >= I || i < 0) {
              i -= lambda;
              j += J / 2;
              if (j >= J) {
                j -= J;
              }
            }
            moved = true;


          }

          if (move_to_play) {
            if (moved) {
              t += 1;
              //if (!time_changed) {
              //  time_changed = true
              //}

              m0 += 1;
              m += 1;


              //move_to_play = m0 < (M0 - 1)
              if (M0 === -1 ) {
                move_to_play = true;
              } else {
                move_to_play = m0 < (M0 - 1);
              }
              if (!move_to_play) {
                playing = true;
                movable = movable_in_playing;
                if (!movable) {
                  jsPsych.pluginAPI.cancelKeyboardResponse(movement_listener);
                }
              }
              frames.push(t);
              reps_times.push(reps);
              thetas_views.push(j);
              phis_views.push(i);
              deltas.push(delta);
              lambdas.push(lambda);
              RT_movements.push(RT_m);
              movements_times.push(Number(moved));
              phases_times.push(0);


              moved = false;
              delta = 0;
              lambda = 0;
              RT_m = 'None';

              times.push(performance.now() -  time_start);

            }
          } else if (playing) {

            t += 1;
            //if (!time_changed) {
            //  time_changed = true
            //}


            frames.push(t);
            reps_times.push(reps);
            thetas_views.push(j);
            phis_views.push(i);
            deltas.push(delta);
            lambdas.push(lambda);
            RT_movements.push(RT_m);
            movements_times.push(Number(moved));
            phases_times.push(1);


            if (movable_in_playing && moved) {
              m1 += 1;
              m += 1;
              moved = false;

              //movable_in_playing = m1 < (M1 - 1);
              if (M1 === -1 ) {
                movable_in_playing = true;
              } else {
                movable_in_playing = m1 < (M1 - 1);
              }

              delta = 0;
              lambda = 0;
              RT_m = 'None';

              movable = movable_in_playing;
              if (!movable) {
                jsPsych.pluginAPI.cancelKeyboardResponse(movement_listener);
              }

            }
            times.push(performance.now() -  time_start);
          }

          if (t >= T) {
            reps += 1;
            if (trial.sequence_reps == -1 || reps < trial.sequence_reps) {
              t = 0;
              frames[frames.length-1] = t;
              reps_times[reps_times.length-1] = reps;
            } else {
              if (trial.stimulus_end === null) {
                j = j_old;
                i = i_old;
                t = t_old;
              } else {
                j = 'None';
                i = 'None';
                t = 'None';
              }
              thetas_views[thetas_views.length-1] = j;
              phis_views[phis_views.length-1] = i;
              frames[frames.length-1] = t;

              reps = 'None';
              reps_times[reps_times.length-1] = reps;

              move_to_play = false;
              playing = false;
              showAnimation = false;

              m = m_old;

              phases_times.push(2);

              movements_times[movements_times.length-1] = 'None';
              movements_times.push('None');

              RT_movements[RT_movements.length-1] = 'None';
              RT_movements.push('None');

              deltas[deltas.length-1] = 'None';
              deltas.push('None');

              lambdas[lambdas.length-1] = 'None';
              lambdas.push('None');


              if (movable) {
                movable = false;
                jsPsych.pluginAPI.cancelKeyboardResponse(movement_listener);
              }

            }

          }
        }
        if (t !== 'None') {
          dir_jit = trial.directories_mvv[j][i][t];
          opacity_jit = trial.opacity_stimuli;
        } else {
          // show "which action???"
          dir_jit = trial.stimulus_end;
          opacity_jit = 1;
        }

        if (trial.render_on_canvas) {
          img.src = dir_jit;
          ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
          ctx.globalAlpha = opacity_jit;
          ctx.drawImage(img,0,0);

        } else {
          display_element.innerHTML += '<img src="' + dir_jit + '" id="jspsych-select-view-and-categorize-multi-view-video-stimuli" style="opacity:' + opacity_jit.toString() + ';"></img>';
          if (trial.prompt !== null) {
            display_element.innerHTML += trial.prompt;
          }
        }

      } else if (trial.feedback) {


        if (trial.render_on_canvas) {
          ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = 'bold 30px serif';
          ctx.globalAlpha = 1;

          if (correct) {
            if (trial.correct_image === null) {
              ctx.fillStyle = 'rgba(0, 255, 0, 255)';
              ctx.fillText('Correct!', center_x_canvas, center_y_canvas);

            } else {
              img.src = trial.correct_image;
              ctx.drawImage(img,0,0);

            }
          } else {
            if (trial.incorrect_image === null) {
              ctx.fillStyle = 'rgba(255, 0, 0, 255)';
              ctx.fillText('Incorrect!', center_x_canvas, center_y_canvas);
            } else {
              img.src = trial.incorrect_image;
              ctx.drawImage(img,0,0);

            }
          }

        } else {

          if (correct) {
            if (trial.correct_image === null) {
              display_element.innerHTML += 'Correct!'.fontcolor('Green').bold();
            } else {
              display_element.innerHTML += '<img src="' + trial.correct_image + '" id="jspsych-animation-image"></img>';
            }
          } else {
            if (trial.incorrect_image === null) {
              display_element.innerHTML += 'Incorrect!'.fontcolor('Red').bold();
            } else {
              display_element.innerHTML += '<img src="' + trial.incorrect_image + '" id="jspsych-animation-image"></img>';
            }
          }
          if (trial.prompt !== null) {
            display_element.innerHTML += trial.prompt;
          }
        }

        // set timeout to clear feedback
        if (!timeoutSet) {
          timeoutSet = true;
          jsPsych.pluginAPI.setTimeout(function() {
            endTrial();
          }, trial.feedback_duration);
        }
      } else {

        endTrial();

      }
    }, trial.frame_time);

    var trial_data = {};


    if (movable) {

      var movement_listener;

      var after_movement = function(info) {



        if (trial.type_of_movements === 'c') {

          //key_pressed = jsPsych.pluginAPI.convertKeyCodeToKeyCharacter(info.key);
          key_pressed = info.key;
          //console.log(info.key, key_pressed)

          if (key_pressed === key_left) { // the key code for 'leftarrow' is 37.
            if (delta !== -1) {
              RT_m =  info.rt;
              delta = -1;
            }
          }

          if (key_pressed === key_right) { // the key code for 'rightarrow' is 39.
            if (delta !== 1) {
              RT_m =  info.rt;
              delta = 1;
            }
          }

          if (key_pressed === key_down) { // the key code for 'downarrow' is 40.
            if (lambda !== 1) {
              RT_m =  info.rt;
              lambda = 1;
            }
          }
          if (key_pressed === key_up) { // the key code for 'uparrow' is 38.
            if (lambda !== -1) {
              RT_m =  info.rt;
              lambda = -1;
            }
          }
        } else if (trial.type_of_movements === 'r') {
          if ((delta === 0) && (lambda === 0)) {
            //key_pressed = jsPsych.pluginAPI.convertKeyCodeToKeyCharacter(info.key);
            RT_m =  info.rt;
            delta = RndInt(-1, 1)
            lambda = RndInt(-1, 1)
            while ((delta === 0) && (lambda === 0)) {
              delta = RndInt(-1, 1)
              lambda = RndInt(-1, 1)
            }
          }
        }
      }

      var movement_listener = jsPsych.pluginAPI.getKeyboardResponse({
        callback_function: after_movement,
        valid_responses: choices_movements,
        //valid_responses: jsPsych.ALL_KEYS,
        rt_method: 'performance',
        persist: true
      });
    }

    var classification_listener;


    var after_classification = function(info) {
      // ignore the response if animation is playing and subject
      // not allowed to respond before it is complete
      if ((!trial.allow_classification_in_move_to_play && move_to_play) || (!trial.allow_classification_in_playing && playing)) {
        return false;
      }
      if (move_to_play || playing) {
        movements_times.push('None');
        RT_movements.push('None');
        deltas.push('None');
        lambdas.push('None');
      }
      if (move_to_play) {
        phases_times.push(0);
        move_to_play = false;
      } else if (playing) {
        phases_times.push(1);
        playing = false;
      }

      showAnimation = false;

      if (movable) {
        movable = false;
        jsPsych.pluginAPI.cancelKeyboardResponse(movement_listener);
      }
      jsPsych.pluginAPI.cancelKeyboardResponse(classification_listener);

      //key_classification = jsPsych.pluginAPI.convertKeyCodeToKeyCharacter(info.key);
      key_classification = info.key;
      //console.log(key_classification, info.key)
      correct = Number(trial.key_class === key_classification);

      responded = true;

      RT_classification =  info.rt;

      trial_data = {
        //"stimulus": JSON.stringify(trial.stimuli),
        "key_classification": key_classification,
        "correct": correct,
        "RT_classification": RT_classification,
        "frames": frames.join(' '),
        "reps_times": reps_times.join(' '),
        "phases_times": phases_times.join(' '),
        "times": times.join(' '),
        "thetas_views": thetas_views.join(' '),
        "phis_views": phis_views.join(' '),
        "n_movements": m,
        "movements_times": movements_times.join(' '),
        "RT_movements": RT_movements.join(' '),
        "deltas": deltas.join(' '),
        "lambdas": lambdas.join(' ')
      };

    };

    classification_listener = jsPsych.pluginAPI.getKeyboardResponse({
      callback_function: after_classification,
      valid_responses: trial.choices_classes,
      //valid_responses: jsPsych.ALL_KEYS,
      rt_method: 'performance',
      persist: true,
      allow_held_key: false
    });

    function RndInt(min, max) {
      return Math.floor(Math.random() * (max - min) ) + min;
    }

    function endTrial() {
      if (trial.render_on_canvas) {
        canvas.remove();
        prompt_div.remove();
      }
      jsPsych.pluginAPI.cancelKeyboardResponse(movement_listener);
      jsPsych.pluginAPI.cancelKeyboardResponse(classification_listener);
      clearInterval(animate_interval); // stop animation!
      jsPsych.pluginAPI.clearAllTimeouts();
      display_element.innerHTML = ''; // clear everything
      jsPsych.finishTrial(trial_data);
    };
  };

  return plugin;
})();
