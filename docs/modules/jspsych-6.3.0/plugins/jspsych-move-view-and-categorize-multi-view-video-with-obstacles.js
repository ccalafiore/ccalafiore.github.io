/**
 * jspsych plugin for proactive action classification with feedback
 * Carmelo Calafiore
 *
 * documentation: docs.jspsych.org
 *
 * description
 * This plugin was design for proactive action classification. It allows the user to move/select the viewpoint where
 * to look at the action from. The number of all possible viewpoints V is equal to J x I where J is the number of
 * all possible thetas and I is the number of all possible phis. The thetas are the horizontal coordinates of all
 * viewpoints while the phis are the vertical coordinates of all views. Both J and I are defined by the
 * shape of the parameter "directories_mvv" which must be a 3D array of image directories with shape of [J, I, T].
 * T is the number of frame for each mvv. Therefore, each viewpoint is define by 2D coordinates [j, i], where j is
 * the j_th theta and i is the i_th phi. j must be in this range: 0 <= j < J and i must be in this range: 0 <= i < I.
 *
 * examples
 * Check out these 2 websites for 2 experiments I have made so far with this plugin as examples
 * 1. Experiment with controlled view movements https://ccalafiore.github.io/experiments/experiment_001/index.html;
 * 2. Experiment with random view movements https://ccalafiore.github.io/experiments/experiment_002/index.html.
 **/


jsPsych.plugins['move-view-and-categorize-multi-view-video-with-obstacles'] = (function() {

  var plugin = {};

  jsPsych.pluginAPI.registerPreload('move-view-and-categorize-multi-view-video-with-obstacles', 'directories_mvv', 'image');

  plugin.info = {
    name: 'move-view-and-categorize-multi-view-video-with-obstacles',
    description: '',
    parameters: {
      directories_mvv: {
        type: jsPsych.plugins.parameterType.IMAGE,
        pretty_name: 'directories_mvv',
        default: undefined,
        description: 'The 3D array of image directories of the Multi-View Video (MVV) with shape [J, I, T]. J is ' +
          'the number of all possible horizontal view coordinates. The all possible horizontal view coordinates ' +
          'are called thetas. I is the the number of all possible vertical view coordinates. The all possible ' +
          'vertical view coordinates are called phis. T is the time length of the MVV, that is the number ' +
          'of all frames of each Single-View Video.'
      },
      view: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Starting View',
        default: undefined,
        description: 'Starting View Coordinate. ' +
          'In other words, it is the view coordinates which the trial starts with. view[0]=j and view[1]=i, where ' +
          'j is the j_th theta and i is the i_th phi. j=0 is the most left view coordinate and j=J-1 is the most ' +
          'right view coordinate. i=0 is the most top view coordinate and j=J-1 is the most bottom view coordinate. ' +
          'j must be in this range: 0 <= j < J and i must be in this range: 0 <= i < I.'
      },
      M: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'M Movements',
        default: [0, -1],
        description: 'The trial has 3 phases: 1. move-to-play; 2. playing; 3. waiting-classification. \n' +
          '1. The trial starts with the move-to-play phase where the video is played as the view is moved. Thus, ' +
          't=t+1, if a movement is recorded, else t=t. t is the t_th frame of the MVV. M[0] is the number ' +
          'of necessary movements in the move-to-play phase to start the playing phase. To skip this phase, ' +
          'set M[0]=0. If M[0]=-1, there are unlimited movements in the move-to-play phase and ' +
          'the playing phase will never starts;\n' +
          '2. In the playing phase, the video plays regardless of the movements until the end of the video. ' +
          'So, t=t+1 every "frame_time" milliseconds until t=T-1. M[1] is the maximum number of movements ' +
          'allowed in the playing phase. If the number of movements made in the playing phase reaches M[1], ' +
          'the view will be locked and it will not be possible to move it anymore for the rest of the playing ' +
          'phase and for the rest of the whole trial. If M[1]=-1 there are unlimited movements in the ' +
          'playing phase until the end of the video;\n' +
          '3. In the waiting-classification phase, this plugin will wait the user to classify the MVV.'
      },
      key_class: {
        type: jsPsych.plugins.parameterType.KEY,
        pretty_name: 'Key Classification',
        default: undefined,
        description: 'The key character to indicate correct classification.'
      },
      choices_classes: {
        type: jsPsych.plugins.parameterType.KEY,
        pretty_name: 'Class Choices',
        default: jsPsych.ALL_KEYS,
        array: true,
        description: 'The keys subject is allowed to press to classify the MVV.'
      },
      choices_movements: {
        type: jsPsych.plugins.parameterType.KEY,
        pretty_name: 'Movement Choices',
        default: ['arrowleft', 'arrowright', 'arrowdown', 'arrowup'],
        array: true,
        description: 'The keys [key_left, key_right, key_down, key_up] to move the view:\n' +
          '1. If the parameter type_of_movements=\'c\', then:\n' +
          '    1. choices_movements[0] is the key to move the view to the left. If choices_movements[0]=null, no ' +
          'key will move the view to the left;\n' +
          '    2. choices_movements[1] is the key to move the view to the right. If choices_movements[1]=null, no ' +
          'key will move the view to the right;\n' +
          '    3. choices_movements[2] is the key to move the view down. If choices_movements[2]=null, no ' +
          'key will move the view down;\n' +
          '    4. choices_movements[3] is the key to move the view up. If choices_movements[3]=null, no ' +
          'key will move the view up;\n' +
          '2. If the parameter type_of_movements=\'r\', then any key in choices_movements will move the view ' +
          'to a random direction.'
      },
      type_of_movements: {
        type: jsPsych.plugins.parameterType.KEY,
        pretty_name: 'Type of Movements',
        default: 'c',
        array: true,
        description: 'The type of view movements which could either be \'c\' for controlled or \'r\' for random. ' +
          'See the description of the parameter "choices_movements" for details of the controlled and random ' +
          'movements.'
      },
      obstacle: {
        type: jsPsych.plugins.parameterType.IMAGE,
        pretty_name: 'obstacle',
        default: null,
        description: 'The image directory of the obstacle to be displayed in some views of the MVV.'
      },
      theta_left_margin_obstacle: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'theta_left_margin_obstacle',
        default: null,
        description: 'The j_th theta of the views where the left margin of the obstacle is shown for 0 <= j < J.'
      },
      theta_right_margin_obstacle: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'theta_right_margin_obstacle',
        default: null,
        description: 'The j_th theta of the views where the right margin of the obstacle is shown for 0 <= j < J.'
      },
      phi_bottom_margin_obstacle: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'phi_bottom_margin_obstacle',
        default: null,
        description: 'The i_th phi of the views where the bottom margin of the obstacle is shown for 0 <= i < I.'
      },
      phi_top_margin_obstacle: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'phi_top_margin_obstacle',
        default: null,
        description: 'The i_th phi of the views where the top margin of the obstacle is shown for 0 <= i < I.'
      },
      left_margin_obstacle: {
        type: jsPsych.plugins.parameterType.FLOAT,
        pretty_name: 'left_margin_obstacle',
        default: 0.75,
      description: 'x coordinate where the left margin of the obstacle image is in the views with the left ' +
        'obstacle margin. It should be a number between 0 and 1, where 0 is the left coordinate, 1 means ' +
        'right coordinate.'
      },
      right_margin_obstacle: {
      type: jsPsych.plugins.parameterType.FLOAT,
      pretty_name: 'right_margin_obstacle',
      default: 0.25,
      description: 'x coordinate where the right margin of the obstacle image is in the views with the right ' +
        'obstacle margin. It should be a number between 0 and 1, where 0 is the left coordinate, 1 means ' +
        'right coordinate.'
      },
      bottom_margin_obstacle: {
      type: jsPsych.plugins.parameterType.FLOAT,
      pretty_name: 'bottom_margin_obstacle',
      default: 0.25,
      description: 'y coordinate where the bottom margin of the obstacle image is in the views with the bottom ' +
        'obstacle margin. It should be a number between 0 and 1, where 0 is the top coordinate, 1 means ' +
        'bottom coordinate.'
      },
      top_margin_obstacle: {
      type: jsPsych.plugins.parameterType.FLOAT,
      pretty_name: 'top_margin_obstacle',
      default: 0.75,
      description: 'y coordinate where the top margin of the obstacle image is in the views with the top ' +
        'obstacle margin. It should be a number between 0 and 1, where 0 is the top coordinate, 1 means ' +
        'bottom coordinate.'
      },
      scale_width_obstacle: {
      type: jsPsych.plugins.parameterType.FLOAT,
      pretty_name: 'scale_width_obstacle',
      default: 1,
      description: 'The width scale of the obstacle image. Default is 1 (original width).'
      },
      scale_height_obstacle: {
      type: jsPsych.plugins.parameterType.FLOAT,
      pretty_name: 'scale_height_obstacle',
      default: 1,
      description: 'The height scale of the obstacle image. Default is 1 (original height).'
      },
      text_correct: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Correct Text',
        default: 'Correct!',
        description: 'The text to show when subject classifies the MVV correctly if image_correct=null.'
      },
      text_incorrect: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Incorrect Text',
        default: 'Incorrect!',
        description: 'The text to show when subject classifies the MVV incorrectly if image_incorrect=null.'
      },
      image_correct: {
        type: jsPsych.plugins.parameterType.IMAGE,
        pretty_name: 'Correct Image',
        default: null,
        description: 'Directory of the image to show when subject classifies the MVV correctly.'
      },
      image_incorrect: {
        type: jsPsych.plugins.parameterType.IMAGE,
        pretty_name: 'Incorrect Image',
        default: null,
        description: 'Directory of the image to show when subject classifies the MVV incorrectly.'
      },
      frame_time: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Frame Time',
        default: 500,
        description: 'Duration in milliseconds to display the frame t for 0 <= t < T.'
      },
      sequence_reps: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Sequence Repetitions',
        default: 1,
        description: 'How many times to display the entire MVV sequence.'
      },
      allow_classification_in_move_to_play: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Allow classification in the move-to-play phase',
        default: false,
        description: 'If true, subject can classify during the move-to-play phase.'
      },
      allow_classification_in_playing: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Allow classification in the playing phase',
        default: true,
        description: 'If true, subject can classify during the playing phase.'
      },
      alpha_images: {
        type: jsPsych.plugins.parameterType.FLOAT,
        pretty_name: 'Image Alpha',
        default: 1.0,
        description: 'The alpha of the MVV images to be displayed. It must be a float from 0 to 1. If ' +
          'alpha_images=0, the images will be completely transparent. If alpha_images=0, the images will not be ' +
          'transparent at all.'
      },
      blur_images: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Image Blurring',
        default: 0,
        description: 'The standard deviation of gaussian filter to blur the MVV images to be displayed. ' +
        'The unit is pixels'
      },
      stimulus_end: {
        type: jsPsych.plugins.parameterType.IMAGE,
        pretty_name: 'Stimuli End',
        default: null,
        description: 'The image to be displayed if the MVV ends and no classifications has ben recorded.'
      },
      feedback: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Feedback',
        default: true,
        description: 'If true, it shows a feedback'
        },
      feedback_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Feedback Duration',
        default: 2000,
        description: 'How long to show the feedback'
      },
      prompt: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Prompt',
        default: null,
        description: 'Any html content here will be displayed below the stimulus.'
      },
      render_on_canvas: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Render On Canvas',
        default: true,
        description: 'If true, the images will be drawn onto a canvas element (prevents blank screen ' +
          'between consecutive images in some browsers). If false, the image will be shown via an img element.'
      }
    }
  }

  plugin.trial = function(display_element, trial) {



    if ((trial.obstacle == null) || (trial.theta_left_margin_obstacle == null) || (trial.theta_right_margin_obstacle == null) || (trial.phi_bottom_margin_obstacle == null) || (trial.phi_top_margin_obstacle == null)){
      var trial_with_obstacle = false;

    } else {

      var trial_with_obstacle = true;

      // If there are some views of the the trial with obstacle, trial.render_on_canvas = true.
      // This is because this code can only draw the obstacle image on the image to classify through canvas.
      trial.render_on_canvas = true
    }

    var img_stimuli = new Image();
    img_stimuli.src = trial.directories_mvv[0][0][0];
    width_stimuli = img_stimuli.naturalWidth;
    height_stimuli = img_stimuli.naturalHeight;

    if (trial.render_on_canvas) {
      // first clear the display element (because the render_on_canvas method appends to display_element
      // instead of overwriting it with .innerHTML)
      if (display_element.hasChildNodes()) {
        // can't loop through child list because the list will be modified by .removeChild()
        while (display_element.firstChild) {
          display_element.removeChild(display_element.firstChild);
        }
      }
      var canvas = document.createElement('canvas');
      canvas.id = 'jspsych-move-view-and-categorize-multi-view-video-with-obstacles-stimuli';
      canvas.style.margin = 0;
      canvas.style.padding = 0;
      display_element.insertBefore(canvas, null);
      var ctx = canvas.getContext('2d');

      canvas.width = width_stimuli;
      canvas.height = height_stimuli;
      var center_x_canvas = canvas.width / 2;
      var center_y_canvas = canvas.height / 2;

      if (trial.prompt !== null) {
        var prompt_div = document.createElement('div');
        prompt_div.id = 'jspsych-move-view-and-categorize-multi-view-video-with-obstacles-prompt';
        prompt_div.style.visibility = 'visible';
        prompt_div.innerHTML = trial.prompt;
        display_element.insertBefore(prompt_div, canvas.nextElementSibling);
      }
      //var feedback_div = document.createElement('div');
      //display_element.insertBefore(feedback_div, display_element.nextElementSibling);
    } else {

      if (trial.image_correct === null) {
        trial.text_correct = (
          '<p id="jspsych-move-view-and-categorize-multi-view-video-with-obstacles-stimuli" ' +
          'style="margin-left: auto;margin-right: auto;margin-top: 0px;margin-bottom: 0px;' +
          'padding-top: ' + ((height_stimuli / 2) - 14) + 'px;padding-bottom: ' + ((height_stimuli / 2) - 14 + 7) +
          'px;text-align: center;font-size: 30px;color: rgb(0, 255, 0);"><b>' + trial.text_correct + '</b></p>');
      }
      if (trial.image_incorrect === null) {
        trial.text_incorrect = (
          '<p id="jspsych-move-view-and-categorize-multi-view-video-with-obstacles-stimuli" ' +
          'style="margin-left: auto;margin-right: auto;margin-top: 0px;margin-bottom: 0px;' +
          'padding-top: ' + ((height_stimuli / 2) - 14) + 'px;padding-bottom: ' + ((height_stimuli / 2) - 14 + 7) +
          'px;text-align: center;font-size: 30px;color: rgb(255, 0, 0);"><b>' + trial.text_incorrect + '</b></p>');
      }
    }

    trial.alpha_images = Number(trial.alpha_images)


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
//    var pad_times = '0000';

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

    if ((trial.obstacle == null) || (trial.theta_left_margin_obstacle == null) || (trial.theta_right_margin_obstacle == null) || (trial.phi_bottom_margin_obstacle == null) || (trial.phi_top_margin_obstacle == null)){
      var trial_with_obstacle = false;
    } else {

      var trial_with_obstacle = true;
    }

    if (trial.obstacle == null) {
//      var dir_obstacle = "../../modules/jspsych-6.3.0/examples/img/wall.jpg";
//    var dir_obstacle = "../examples/img/wall.png"
      var dir_obstacle = trial.obstacle;

      var theta_left_margin_obstacle = trial.theta_left_margin_obstacle;
      var theta_right_margin_obstacle = trial.theta_right_margin_obstacle;
      var phi_bottom_margin_obstacle = trial.phi_bottom_margin_obstacle;
      var phi_top_margin_obstacle = trial.phi_top_margin_obstacle;

      var left_margin_obstacle = trial.left_margin_obstacle;
      var right_margin_obstacle = trial.right_margin_obstacle;
      var bottom_margin_obstacle = trial.bottom_margin_obstacle;
      var top_margin_obstacle = trial.top_margin_obstacle;

      var scale_width_obstacle = trial.scale_width_obstacle;
      var scale_height_obstacle = trial.scale_height_obstacle;

      var img_obstacle = new Image();
      img_obstacle.src = dir_obstacle;

      var width_obstacle = img_obstacle.naturalWidth;
      var height_obstacle = img_obstacle.naturalHeight;

      if (theta_left_margin_obstacle < theta_right_margin_obstacle) {
        var thetas_obstacle = Range(theta_left_margin_obstacle, theta_right_margin_obstacle + 1, 1, 'n');
      } else if (theta_left_margin_obstacle > theta_right_margin_obstacle) {
        var thetas_obstacle = Range(theta_left_margin_obstacle, J, 1, 'n').concat(Range(0, theta_right_margin_obstacle + 1, 1, 'n'));
      } else if (theta_left_margin_obstacle == theta_right_margin_obstacle) {
        if (left_margin_obstacle < right_margin_obstacle) {
          var thetas_obstacle = Range(theta_left_margin_obstacle, theta_right_margin_obstacle + 1, 1, 'n');
        } else if (right_margin_obstacle < left_margin_obstacle) {
          var thetas_obstacle = Range(theta_left_margin_obstacle, J, 1, 'n').concat(Range(0, theta_right_margin_obstacle + 1, 1, 'n'));
        } else if (left_margin_obstacle == right_margin_obstacle) {
          var thetas_obstacle = [];
        }
      }
      var n_thetas_obstacle = thetas_obstacle.length;
      var E = n_thetas_obstacle;

      var sWidth_obstacle = Math.round(width_stimuli / scale_width_obstacle);

      if (theta_left_margin_obstacle != theta_right_margin_obstacle) {

        var sWidth_theta_left_margin_obstacle = Math.round(sWidth_obstacle * (1 - left_margin_obstacle));
        var sWidth_theta_right_margin_obstacle = Math.round(sWidth_obstacle * right_margin_obstacle);

        var dx_theta_right_margin_obstacle = 0;
        var dWidth_theta_left_margin_obstacle = Math.round(width_stimuli * (1 - left_margin_obstacle));
        var dWidth_theta_right_margin_obstacle = Math.round(width_stimuli * right_margin_obstacle);

      } else {
        if (left_margin_obstacle < right_margin_obstacle) {
          var sWidth_theta_left_margin_obstacle = Math.round(sWidth_obstacle * (1 - left_margin_obstacle - (1 - right_margin_obstacle)));
          var sWidth_theta_right_margin_obstacle = sWidth_theta_left_margin_obstacle;

          var dx_theta_right_margin_obstacle = Math.round(width_stimuli * left_margin_obstacle);
          var dWidth_theta_left_margin_obstacle = Math.round(width_stimuli * (1 - left_margin_obstacle - (1 - right_margin_obstacle)));
          var dWidth_theta_right_margin_obstacle = dWidth_theta_left_margin_obstacle;

        } else if (right_margin_obstacle < left_margin_obstacle) {
          var sWidth_theta_left_margin_obstacle = Math.round(sWidth_obstacle * (1 - left_margin_obstacle));
          var sWidth_theta_right_margin_obstacle = Math.round(sWidth_obstacle * right_margin_obstacle);

          var dx_theta_right_margin_obstacle = 0;
          var dWidth_theta_left_margin_obstacle = Math.round(width_stimuli * (1 - left_margin_obstacle));
          var dWidth_theta_right_margin_obstacle = Math.round(width_stimuli * right_margin_obstacle);

        } else if (left_margin_obstacle == right_margin_obstacle) {
          var sWidth_theta_left_margin_obstacle = 0;
          var sWidth_theta_right_margin_obstacle = 0;

          var dx_theta_right_margin_obstacle = 0;
          var dWidth_theta_left_margin_obstacle = 0;
          var dWidth_theta_right_margin_obstacle = 0;
        }
      }

      var sx_obstacle_0_tmp = sWidth_obstacle - sWidth_theta_left_margin_obstacle;

      var step_sx_obstacle =  Math.round((width_obstacle - sWidth_theta_right_margin_obstacle + sx_obstacle_0_tmp) / (n_thetas_obstacle-1));
      var tmp = Math.max(left_margin_obstacle, 1 - right_margin_obstacle);
      if (tmp == 0) {
        if (step_sx_obstacle > sWidth_obstacle) {
          step_sx_obstacle = Math.round(sWidth_obstacle * 0.25);
        }
      } else if ((0 < tmp) && (tmp <= 1)) {
        if (step_sx_obstacle > (sWidth_obstacle * tmp)) {
          step_sx_obstacle = Math.round(sWidth_obstacle * tmp);
        }
      }

      var sx_obstacle = [-sx_obstacle_0_tmp];

      for (e = 1; e < E; e += 1) {
        sx_obstacle.push(Math.floor((sx_obstacle[e-1] + step_sx_obstacle)));
      }
      sx_obstacle[0] = 0;

      var dx_theta_left_margin_obstacle = Math.round(width_stimuli * left_margin_obstacle);

      // phis_obstacle
      var phis_obstacle = Range(phi_top_margin_obstacle, phi_bottom_margin_obstacle + 1, 1, 'n');
      var n_phis_obstacle = phis_obstacle.length;
      var V = n_phis_obstacle;

      var sHeight_obstacle = Math.round(height_stimuli / scale_height_obstacle);

      if (phi_top_margin_obstacle != phi_bottom_margin_obstacle) {

        var sHeight_phi_top_margin_obstacle = Math.round(sHeight_obstacle * (1 - top_margin_obstacle));
        var sHeight_phi_bottom_margin_obstacle = Math.round(sHeight_obstacle * bottom_margin_obstacle);

        var dy_phi_bottom_margin_obstacle = 0;
        var dHeight_phi_top_margin_obstacle = Math.round(height_stimuli * (1 - top_margin_obstacle));
        var dHeight_phi_bottom_margin_obstacle = Math.round(height_stimuli * bottom_margin_obstacle);

      } else {
        if (top_margin_obstacle < bottom_margin_obstacle) {
          var sHeight_phi_top_margin_obstacle = Math.round(sHeight_obstacle * (1 - top_margin_obstacle - (1 - bottom_margin_obstacle)));
          var sHeight_phi_bottom_margin_obstacle = sHeight_phi_top_margin_obstacle;

          var dy_phi_bottom_margin_obstacle = Math.round(height_stimuli * top_margin_obstacle);
          var dHeight_phi_top_margin_obstacle = Math.round(height_stimuli * (1 - top_margin_obstacle - (1 - bottom_margin_obstacle)));
          var dHeight_phi_bottom_margin_obstacle = dHeight_phi_top_margin_obstacle;

        } else {
          var sHeight_phi_top_margin_obstacle = 0;
          var sHeight_phi_bottom_margin_obstacle = 0;

          var dy_phi_bottom_margin_obstacle = 0;
          var dHeight_phi_top_margin_obstacle = 0;
          var dHeight_phi_bottom_margin_obstacle = 0;
        }
      }

      var sy_obstacle_0_tmp = sHeight_obstacle - sHeight_phi_top_margin_obstacle;

      var step_sy_obstacle =  Math.round((height_obstacle - sHeight_phi_bottom_margin_obstacle + sy_obstacle_0_tmp) / (n_phis_obstacle-1));
      tmp = Math.max(top_margin_obstacle, 1 - bottom_margin_obstacle);
      if (tmp == 0) {
        if (step_sy_obstacle > sHeight_obstacle) {
          step_sy_obstacle = Math.round(sHeight_obstacle * 0.25);
        }
      } else if ((0 < tmp) && (tmp <= 1)) {
        if (step_sy_obstacle > (sHeight_obstacle * tmp)) {
          step_sy_obstacle = Math.round(sHeight_obstacle * tmp);
        }
      }

      var sy_obstacle = [-sy_obstacle_0_tmp];

      for (v = 1; v < V; v += 1) {
        sy_obstacle.push(Math.floor((sy_obstacle[v-1] + step_sy_obstacle)));
      }
      sy_obstacle[0] = 0;

      var dy_phi_top_margin_obstacle = Math.round(height_stimuli * top_margin_obstacle);

      var view_with_obstacle = false;
    }

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
          alpha_jit = trial.alpha_images;

          if (trial.blur_images == 0) {
            filter_jit = 'none';
          } else {
            filter_jit = 'blur(' + trial.blur_images + 'px)';
          }
          if (trial_with_obstacle) {

            function where_theta(theta_obstacle_e) {
              return theta_obstacle_e == j;
            }
            e = thetas_obstacle.findIndex(where_theta);

            function where_phi(phi_obstacle_v) {
              return phi_obstacle_v == i;
            }
            v = phis_obstacle.findIndex(where_phi);

            view_with_obstacle = ((e != -1) && (v != -1));

            if (view_with_obstacle) {

              if (j == theta_left_margin_obstacle) {

                sWidth = sWidth_theta_left_margin_obstacle;

                dx = dx_theta_left_margin_obstacle;
                dWidth = dWidth_theta_left_margin_obstacle;

              } else if (j == theta_right_margin_obstacle) {
                sWidth = sWidth_theta_right_margin_obstacle;

                dx = dx_theta_right_margin_obstacle;
                dWidth = dWidth_theta_right_margin_obstacle;

              } else {

                sWidth = sWidth_obstacle;

                dx = dx_theta_right_margin_obstacle;
                dWidth = width_stimuli;

              }

              // phi_obstacle
              if (i == phi_top_margin_obstacle) {

                sHeight = sHeight_phi_top_margin_obstacle;

                dy = dy_phi_top_margin_obstacle;
                dHeight = dHeight_phi_top_margin_obstacle;

              } else if (i == phi_bottom_margin_obstacle) {
                sHeight = sHeight_phi_bottom_margin_obstacle;

                dy = dy_phi_bottom_margin_obstacle;
                dHeight = dHeight_phi_bottom_margin_obstacle;

              } else {

                sHeight = sHeight_obstacle;

                dy = dy_phi_bottom_margin_obstacle;
                dHeight = height_stimuli;
              }
            }
          }

        } else {
          // show "which action???"
          dir_jit = trial.stimulus_end;
          alpha_jit = 1;
          filter_jit = 'none';

          if (trial_with_obstacle) {
            view_with_obstacle = false;
          }
        }

        if (trial.render_on_canvas) {
          img_stimuli.src = dir_jit;
          ctx.clearRect(0, 0, width_stimuli, height_stimuli);
          ctx.globalAlpha = alpha_jit;
          ctx.filter = filter_jit;
          ctx.drawImage(img_stimuli,0,0, width_stimuli, height_stimuli);

          if (trial_with_obstacle) {
            if (view_with_obstacle) {
              ctx.clearRect(dx, dy, dWidth, dHeight);
              ctx.drawImage(img_obstacle, sx_obstacle[e], sy_obstacle[v], sWidth, sHeight, dx, dy, dWidth, dHeight);

              if ((j == theta_left_margin_obstacle) && (j == theta_right_margin_obstacle) && (right_margin_obstacle < left_margin_obstacle)) {
                sWidth = sWidth_theta_right_margin_obstacle;

                dx = dx_theta_right_margin_obstacle;
                dWidth = dWidth_theta_right_margin_obstacle;

                ctx.clearRect(dx, dy, dWidth, dHeight);
                ctx.drawImage(img_obstacle, sx_obstacle[sx_obstacle.length-1], sy_obstacle[v], sWidth, sHeight, dx, dy, dWidth, dHeight);
              }
            }
          }

        } else {
          display_element.innerHTML += (
            '<img src="' + dir_jit + '" id="jspsych-move-view-and-categorize-multi-view-video-with-obstacles-stimuli" ' +
            'style="opacity: ' + alpha_jit.toString() + ';filter: ' + filter_jit + ';"></img>');

          // add code here to show the obstacle image on the image

          if (trial.prompt !== null) {
            display_element.innerHTML += trial.prompt;
          }
        }

      } else if (trial.feedback) {


        if (trial.render_on_canvas) {
          ctx.clearRect(0, 0, width_stimuli, height_stimuli);
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = 'bold 30px serif';
          ctx.globalAlpha = 1;

          if (correct) {
            if (trial.image_correct === null) {
              ctx.fillStyle = 'rgb(0, 255, 0)';
              ctx.fillText('Correct!', center_x_canvas, center_y_canvas);

            } else {
              img_stimuli.src = trial.image_correct;
              ctx.drawImage(img_stimuli,0,0);

            }
          } else {
            if (trial.image_incorrect === null) {
              ctx.fillStyle = 'rgb(255, 0, 0)';
              ctx.fillText('Incorrect!', center_x_canvas, center_y_canvas);
            } else {
              img_stimuli.src = trial.image_incorrect;
              ctx.drawImage(img_stimuli,0,0);

            }
          }

        } else {

          if (correct) {
            if (trial.image_correct === null) {
              display_element.innerHTML += trial.text_correct;
            } else {
              display_element.innerHTML += '<img src="' + trial.image_correct +
                '" id="jspsych-move-view-and-categorize-multi-view-video-with-obstacles-stimuli"></img>';
            }
          } else {
            if (trial.image_incorrect === null) {
              display_element.innerHTML += trial.text_incorrect;
            } else {
              display_element.innerHTML += '<img src="' + trial.image_incorrect +
                '" id="jspsych-move-view-and-categorize-multi-view-video-with-obstacles-stimuli"></img>';
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
      correct = trial.key_class === key_classification;

      responded = true;

      RT_classification =  info.rt;

      trial_data = {
        //'stimulus': JSON.stringify(trial.stimuli),
        'key_classification': key_classification,
        'correct': Number(correct),
        'RT_classification': RT_classification,
        'frames': frames.join(' '),
        'reps_times': reps_times.join(' '),
        'phases_times': phases_times.join(' '),
        'times': times.join(' '),
        'thetas_views': thetas_views.join(' '),
        'phis_views': phis_views.join(' '),
        'n_movements': m,
        'movements_times': movements_times.join(' '),
        'RT_movements': RT_movements.join(' '),
        'deltas': deltas.join(' '),
        'lambdas': lambdas.join(' ')
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
