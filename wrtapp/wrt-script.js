// Internet Explorer doesn't support includes()
if (!Array.prototype.includes) {
  Object.defineProperty(Array.prototype, "includes", {
    enumerable: false,
    value: function(obj) {
        var newArr = this.filter(function(el) {
          return el == obj;
        });
        return newArr.length > 0;
      }
  });
}

function get_value(form_elements, name) {
    var value = form_elements[name].value;
    if(value == null){
        if($('input[name='+name+']').is('input:radio')){
            // MS Edge doesn't have value for group of radio buttons
            value = $('input[name='+name+']:checked').val();
        }
    }
    if(value == null){
        value = '';
    }
    return value;
}


// WRT code


$(document).ready(function(){
    $(".owl-carousel").owlCarousel({
        items: 1,
        touchDrag:false,
        mouseDrag:false,
        center: true,
        startPosition: 0,
        dots: false,
        smartSpeed: 1
    });
    $(".owl-carousel").trigger('refresh.owl.carousel');
    $(function () { objectFitImages() });
});

// Get time of page enter and unblock keyboard input for some time
$(".owl-carousel").on("refreshed.owl.carousel", newPage);
$(".owl-carousel").on("translated.owl.carousel", newPage);

var timer = null;
var progress_bar = null;
function newPage(e) {
    var index = $(".owl-carousel .owl-item.active").index();
    console.log("Page "+index);

    page_enter = new Date();

    if(next_keys[index] != "") {
        // Remove focus if key tracking is enabled to disable using of Enter to move to next slide
        $(':focus').blur()
    }
    if(timeouts[index] != "") {
        var timeout = parseInt(timeouts[index]);
        timer = setTimeout(function () {
            nextPage();
        }, timeout);
        progress_bar = new ProgressBar.Line(progressBar, {
            duration: timeout,
            trailWidth: 0.8,
        });
        progress_bar.animate(1.0);
    }
    setTimeout(function () {
        $(".owl-carousel").removeClass("lock");
        console.log("Unlock");
    }, 50);
};


var session_start = new Date();
var result_stored = false;

var page_enter = new Date();

var recorded_keys = {};
var recorded_times = {};


function saveResults() {
    $(".time_stop").slideDown();
    $("#database_fail").slideUp();
    $("#database_success").slideUp();

    var session_end = new Date();
    var form = document.getElementById("custom_input").elements;
    var inputs = new Set([]);
    for (var i = 0; i<form.length; i++) {
        if(form[i].name !== "") {
            inputs.add(form[i].name);
        }
    }
    var custom_vars = "";
    var custom_data = "";
    inputs.forEach(function(val, key, set) {
        custom_vars += val + ";";
        custom_data += get_value(form, val) + ";";
    });
    custom_vars = custom_vars.slice(0, -1);
    custom_data = custom_data.slice(0, -1);
    console.log("custom_data -", custom_data);
    $.ajax({
        url: 'send.php',
        type: 'POST',
        timeout: 15000,
        data: {"start": session_start.toUTCString(), "end": session_end.toUTCString(), "custom_vars": custom_vars, "custom_data": custom_data, "times": recorded_times, "keys": recorded_keys},
        success: function (msg) {
            $(".time_stop").slideUp();
            $("#database_fail").slideUp();
            $("#database_success").slideDown();
        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.log(xhr.status);
            console.log(thrownError);
            $(".time_stop").slideUp();
            $("#database_success").slideUp();
            $("#database_fail").slideDown();
        }
    });
}

$('html').bind('keydown', function(e) {
    var key = e.key;
    var code = e.charCode || e.keyCode;

    var index = $(".owl-carousel .owl-item.active").index();
    var keysUp = next_keys[index].toUpperCase().split(',');
    var keysLo = next_keys[index].toLowerCase().split(',');
    if (keysUp != "" && !$(".owl-carousel").hasClass("lock")) {
        // Key logging enabled
        console.log(key);
        if (keysUp.includes(key) || keysLo.includes(key)) {
            recorded_keys[index] = key;
            nextPage();
        } else {
            console.log(code);
        }
    }
});

function checkForm(){
    var form = document.getElementById("custom_input").elements;
    var inputs = new Set();
    $("#custom_input").find('.owl-item.active input,'+
                            '.owl-item.active select,'+
                            '.owl-item.active textarea,'+
                            '.owl-item.active button,'+
                            '.owl-item.active datalist,'+
                            '.owl-item.active output'
    ).each(function(index, item){
        if(item.name !== "") {
            inputs.add(item.name);
        }
    });

    var valid = true;
    inputs.forEach(function(val, key, set){
        var message = "";
        if(get_value(form, val) === "") {
            message = "Missing value!";
            valid = false;
        }
        if(NodeList.prototype.isPrototypeOf(form[val])){
            form[val].forEach(function(item){
                // Edge doesn't support setCustomValidity for radio boxes
                if (item.setCustomValidity) item.setCustomValidity(message);
            });
        } else {
            if (form[val].setCustomValidity) form[val].setCustomValidity(message);
        }
    });

    return valid;
}

function nextPage(){
    if(!checkForm()) {return;}
    if(timer) {
        clearTimeout(timer);
        timer = null;
        progress_bar.destroy();
    }

    logTime();
    $(".owl-carousel").addClass("lock");
    console.log("Lock!");
    $(".owl-carousel").trigger("next.owl.carousel");

    // newPage might be called several times for a one page
    if ($(".owl-carousel .owl-item.active .time_stop").length > 0 ){
        saveResults();
    }
}

function prevPage(){
    if(timer) {
        clearTimeout(timer);
        timer = null;
        progress_bar.destroy();
    }

    $(".owl-carousel").addClass("lock");
    console.log("Lock!");
    $(".owl-carousel").trigger("prev.owl.carousel");
}

function logTime(code){
    var now = new Date();
    var index = $(".owl-carousel .owl-item.active").index();

    recorded_times[index] = now.getTime() - page_enter.getTime();
    console.log(now.getTime() - page_enter.getTime());
}


// Custom JS
$('.buttonNext').on("click", function (e) {
    nextPage();
    e.preventDefault();
});

$('.buttonPrev').on("click", function (e) {
    prevPage();
    e.preventDefault();
});
