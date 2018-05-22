$(function () {
    readExcel();
    convExec();
    downloadXls();
    editWorkspace();
    initCookie();
    newWorkspace();
});

var WORKSPACE_COOKIE = 'workspace';

function readExcel() {
    $("#xls").change(function () {
        var tbody = $("#view").find('table tbody');

        var fd = new FormData();

        if ($(this).val() !== '') {
            fd.append('xls', $(this).prop('files')[0]);
            $(this).val('');

            $.ajax({
                url: '/read_xls',
                type: 'post',
                data: fd,
                processData : false,
                contentType : false,
                beforeSend: function() {
                    tbody.empty();
                    if ($("#loader").length === 0) {
                        $("#view").find("table").after('<div id="loader"></div>');
                    }
                }
            }).done(function (result) {
                result.forEach(function (value) {
                    tbody.append(get_view_template(value))
                });
            }).fail(function (jqXHR, textStatus, errorThrown) {
                alert('接続エラー！');
                console.log(jqXHR);
                console.log(textStatus);
                console.log(errorThrown);
            }).always(function () {
                $("#loader").remove();
            });
        }
    });
}

function get_view_template(value) {
    var result;
    if (value.result === 'OK') {
        result = ' class="result-ok"';
    } else if (value.result === 'NG') {
        result = ' class="result-ng"';
    } else {
        result = '';
    }

    return '<tr>'
        + '<td class="check"><input type="checkbox" onchange="check_one();" /></td>'
        + '<td class="count">' + value.count + '</td>'
        + '<td class="question">' + value.question + '</td>'
        + '<td class="answer">' + value.answer + '</td>'
        + '<td class="response">' + value.response + '</td>'
        + '<td class="result"><span' + result + '>' + value.result + '</span></td>'
        + '</tr>';
}

function editWorkspace() {
    $("#workspaceBtn").click(function () {
        $("#workspace-list").html(get_workspace_template());
        open_modal();
    });

    $("#workspace-list").on('click', '.container', function (e) {
        var cookie = $.cookie(WORKSPACE_COOKIE);

        var workspace_id = $(this).data('workspace');
        var name = cookie.workspaces[workspace_id].name;

        if ($(e.target).hasClass('remove')) {
            var caution = '以下の情報を削除しますか？\n' +
                'Name: ' + name + '\n' +
                'Workspace ID: ' + workspace_id
            ;

            if (confirm(caution)) {
                $(this).remove();

                delete cookie.workspaces[workspace_id];
                if (cookie.default === workspace_id) {
                    cookie.default = null;
                    $("#workspaceBtn").text('Workspace選択');
                }

                $.cookie(WORKSPACE_COOKIE, cookie);
            }
        } else {
            $("#workspaceBtn").text(name);

            cookie.default = workspace_id;
            $.cookie(WORKSPACE_COOKIE, cookie);

            close_modal();
        }
    });
}

function initCookie() {
    $.cookie.json = true;

    var cookie = $.cookie(WORKSPACE_COOKIE);

    if (cookie === undefined) {
        $.cookie(WORKSPACE_COOKIE, {default: null, workspaces: {}});
    } else {
        if (cookie.default && cookie.workspaces[cookie.default]) {
            $("#workspaceBtn").text(cookie.workspaces[cookie.default].name);
        }
    }
}

function newWorkspace() {
    $("#newWorkspaceBtn").click(function () {
        var form = $("#workspace-create");

        var input = {
            workspace_id: form.find('input[name="workspace_id"]'),
            name: form.find('input[name="name"]'),
            username: form.find('input[name="username"]'),
            password: form.find('input[name="password"]')
        };

        var workspace_id = input.workspace_id.val();
        var name = input.name.val();
        var username = input.username.val();
        var password = input.password.val();

        form.find('input.error').removeClass('error');

        if (workspace_id && name && username && password) {
            var cookie = $.cookie(WORKSPACE_COOKIE);

            if (cookie.workspaces[workspace_id]) {
                var caution = 'Workspace ID: ' + workspace_id + '\n'
                    + 'は既に存在しています（Name: ' + cookie.workspaces[workspace_id].name + '）。\n'
                    + '書き込みますか？';

                if (!confirm(caution)) {
                    return false;
                }
            }

            cookie.default = workspace_id;
            cookie.workspaces[workspace_id] = {
                name: name,
                username: username,
                password: password
            };

            $.cookie(WORKSPACE_COOKIE, cookie);

            $("#workspaceBtn").text(name);

            close_modal(".modal", function () {
                form.find('input').val('');
            });
        } else {
            if (!workspace_id) {
                input.workspace_id.addClass('error');
            }
            if (!name) {
                input.name.addClass('error');
            }
            if (!username) {
                input.username.addClass('error');
            }
            if (!password) {
                input.password.addClass('error');
            }
        }
    });
}

function get_workspace_template() {
    var template = '';

    var cookie = $.cookie(WORKSPACE_COOKIE);

    $.each(cookie.workspaces, function (workspace_id, info) {
        template +=
            '<div class="container' + (cookie.default === workspace_id ? ' active' : '') + '" data-workspace="' + workspace_id + '">'
            + '<div class="content" title="Workspace ID: ' + workspace_id + '">' + info.name + '</div>'
            + '<div class="content remove"></div>'
            + '</div>'
    });

    return template;
}

function check_all(checkbox) {
    var all_checkbox = $("#view").find("table td.check input:checkbox").not("#check-all");
    var exec_btn = $("#exec_btn");

    if ($(checkbox).is(':checked')) {
        all_checkbox.prop('checked', true);
        exec_btn.removeClass('disabled').prop('disabled', false);
    } else {
        all_checkbox.prop('checked', false);
        exec_btn.addClass('disabled').prop('disabled', true);
    }
}

function check_one() {
    var all_checkbox = $("#view").find("table td.check input:checkbox").not("#check-all");
    var exec_btn = $("#exec_btn");

    if (all_checkbox.filter(':checked').length === 0) {
        exec_btn.addClass('disabled').prop('disabled', true);
    } else {
        exec_btn.removeClass('disabled').prop('disabled', false);
    }

    $("#check-all").prop('checked', all_checkbox.not(':checked').length === 0);
}

function convExec() {
    $("#exec_btn").click(function () {
        var tr = $("#view").find("table td.check input:checkbox:checked").closest('tr');

        var cookie = $.cookie(WORKSPACE_COOKIE);
        var workspace_id = cookie.default;

        if (workspace_id === null) {
            var flash = setInterval(function () {
                $("#workspaceBtn").toggleClass('error');
            }, 250);

            setTimeout(function () {
                clearInterval(flash)
            }, 1000);
        } else {
            tr.each(function () {
                var question = $(this).find('td.question').text();
                var answer = $(this).find('td.answer').text();

                $.ajax({
                    url: '/jre/conv',
                    type: 'post',
                    data: {
                        question: question,
                        workspace_id: workspace_id,
                        username: cookie.workspaces[workspace_id].username,
                        password: cookie.workspaces[workspace_id].password
                    },
                    dataType: 'json',
                    context: this
                }).done(function (result) {
                    var response = result.output.text[0];
                    var compare = compare_result(answer, response);

                    $(this).find('td.response').text(response);
                    $(this).find('td.result span').removeClass(compare ? 'result-ng' : 'result-ok').addClass(compare ? 'result-ok' : 'result-ng').text(compare ? 'OK' : 'NG');
                }).fail(function () {
                    $(this).find('td.result span').removeClass('result-ok').addClass('result-ng').text('NG');
                });
            });
        }
    });
}

function compare_result(answer, response) {
    return answer.replace(/^<<<.+?>>>/, '') === response.replace(/^<<<.+?>>>/, '');
}

function downloadXls() {
    $("#xls_btn").click(function () {
        $("#view").table2excel({
            exclude: '.check',
            name: 'Sheet1',
            filename: 'SUI_result'
        });
    });
}
