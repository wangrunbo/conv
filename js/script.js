$(function () {
    initModal();
});

var FADE_SPEED = 200;

function open_modal(target, callback) {
    if (target === undefined) {
        $(".modal").fadeIn(FADE_SPEED, callback);
    } else {
        $(target).fadeIn(FADE_SPEED, callback);
    }

    $("body").addClass('modalOpen');
}

function close_modal(target, callback) {
    if (target === undefined) {
        $(".modal").fadeOut(FADE_SPEED, callback);
    } else {
        $(target).fadeOut(FADE_SPEED, callback);
    }

    $('body').removeClass('modalOpen');
}

function initModal() {
    $(".modal .modalBox").click(function (e) {
        e.stopPropagation();
    });

    $('.modal, .modal .closeButton button, .modal .cancel').click(function () {
        close_modal($(this).closest('.modal'));
    });
}
