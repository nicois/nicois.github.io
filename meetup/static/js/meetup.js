if(typeof(Storage) !== "undefined") {
    saveToLocalStorage = function(k, v) {
        localStorage.setItem(k, v);
        return v;
    };
    loadFromLocalStorage = function(k, def) {
        var result = localStorage.getItem(k);
        if (result == null)
            return def;
        else
            return result;
    };
} else {
    saveToLocalStorage = function(k, v) { return v; };
    loadFromLocalStorage = function(k, def) { return def; };
}


$( document ).ready(function() {
    var hash = window.location.hash;
    if (hash.length > 0) {
        auth_token=hash.split('&')[0].split('=')[1];
        console.log(auth_token);
        $( "#auth" ).hide();

        show_events();
    } else {
        window.location = "https://secure.meetup.com/oauth2/authorize?client_id=o7m94bmf6ddcrplook7hkq9r6m&response_type=token&redirect_uri=" + encodeURIComponent(window.location.href);
    }

});


murl = function(segment) {
    return "https://api.meetup.com/2/" + segment + "?access_token=" + auth_token;
};

show_events = function () {
    var url = murl("events") + "&status=upcoming,past&time=-1m,&member_id=self";
    $.ajax({
        url: url,
        success: function( data ) {
            console.log("processing result of " + url);
            $( "#content" ).empty();
            console.log(data.results);
            _.each(_.sortBy(_.filter(data.results, function (result) {return _.has(result, "announced");})
                    , function (r) { return -r.time; }), function(result) {
                $( "#content" ).append('<div class="meetup-event" url="' + result.event_url + '"><a>' + new Date(result.time).toDateString() + " " + result.name + '</a></div>');
            });
            $( ".meetup-event" ).on( "click" , function() {
                var event_url = $(this).attr('url');
                console.log(event_url);
                var event_id = event_url.split("/")[5];
                show_answers(event_id);
            });
        },
        dataType: "jsonp"
    });
};

show_answers = function (event_id) {
    var url = murl("rsvps") + "&rsvp=yes&fields=answer_info&event_id=" + event_id;
    $.ajax({
        url: url,
        success: function( data ) {
            console.log("processing result of " + url);
            $( "#content" ).empty();
            console.log("x");
            console.log(data);
            dd = data;
            var has_answers = function(person) { return _.has(person, "answers") };
            var has_answer = function(answer) { return _.has(answer, "answer") };
            var has_question = function(answer) { return _.has(answer, "question") };

            questions = _.union(_.flatten(_.map(_.filter(data.results, has_answers), function(person) {
                    person.answermap = {};
                    return _.map(_.filter(person.answers, has_question), function(answer) {
                        person.answermap[answer.question] = answer.answer;
                        return answer.question;
                    });
            })));
            var table = $('<table border="1">');
            var tr = $('<tr>');
            var th = $('<th>');
            th.append("Name");
            tr.append(th);

            var th = $('<th>');
            th.append("Guests");
            tr.append(th);

            _.each(questions, function(question) {
                var th = $('<th>');
                th.append(question);
                tr.append(th);
            });

            table.append(tr);

            $.each(data.results, function(index, person) {
                var tr = $('<tr>');
                var td = $('<td>');
                if (_.has(person, 'member_photo')) {
                    var href = $('<a href="' + person.member_photo.photo_link + '">');
                    href.append(person.member.name);
                    td.append(href);
                } else {
                    td.append(person.member.name);
                }
                tr.append(td);

                var td = $('<td>');
                td.append(person.guests);
                tr.append(td);

                _.each(questions, function(question) {
                    var td = $('<td>');
                    if(_.has(person.answermap, question))
                        td.append(person.answermap[question]);
                    tr.append(td);
                });
                table.append(tr);
            });
            $( "#content" ).append(table);
        },
        dataType: "jsonp"
    });
};
