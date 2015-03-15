'use strict';
$.ajaxSetup({ timeout: 5000 });                                 // iPad Safari timeout explicitly required
if(!window.console){ window.console = {log: function(){} }; }   // ensure window.console.log function exists

applicationCache.onupdateready = function () {                  // automatically reload page when applicationCache changes
    applicationCache.swapCache();
    window.location.reload();
};

//bootstrap-datepicker.en-GB.js
/**
 * British English translation for bootstrap-datepicker
 * Xavier Dutreilh <xavier@dutreilh.com>
 */
; (function ($) {
    $.fn.datepicker.dates['en-GB'] = {
        days: [], //["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        daysShort: [], //["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        daysMin: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
        months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
        monthsShort: [], //["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        today: "Today",
        clear: "",//"Clear",
        weekStart: 1,
        format: "dd/mm/yyyy"
    };
}(jQuery));
///////////////////////////////////////////////////////////////////////////
// input subroutines
///////////////////////////////////////////////////////////////////////////
function inputCheck($id, $class) {
    if ($($id).val() == "") {
        $($id).addClass($class);
    }
    else {
        $($id).removeClass($class);
        return $($id).val();
    }
}//end function

///////////////////////////////////////////////////////////////////////////
// event handlers
///////////////////////////////////////////////////////////////////////////

$("button[type='submit']").on("click", function () {
    var $username = inputCheck("#username", "inputerror");
    var $password = inputCheck("#password", "inputerror");
    localStorage.username = $username;            // remember username as part of encryption key
    localStorage.removeItem('rememberMe');
    if ($("#rememberMe").is(':checked'))
        localStorage.rememberMe = 'y';


    $("#password").val(""); // clear the password now (and forever)
    timesheet.Authenticate($username, $password);
    return false;
});

$('#offline').on("click", function () {
    timesheet.OnLogout();
});


///////////////////////////////////////////////////////////////////////////
// time table select using mouse or touch event handlers
///////////////////////////////////////////////////////////////////////////

$("td").mousedown(function (e) {   
    timesheet.colour = $('#activities').css("background-color");
    timesheetData.dragstartcolumn = $(this).parent().children().index(this);
    timesheetData.dragstartrow = $(this).parent().parent().children().index(this.parentNode);
    if (timesheetData.dragstartcolumn !== 0) {                                   // column 0 isn't valid to click - no action
        timesheetData.Start();
        $(this).css("background-color", timesheet.colour);                       // start "drag" 
        $(this).val($('#activities').val());
    }
    e.stopPropagation();
});

$("td").mousemove(function (e) {     
    timesheetData.Restore(e,this);
});

$("td").mouseup(function (e) {

    timesheetData.Restore(e, this);
    timesheetData.dragstartcolumn = 0;
    timesheetData.FromPage();

});

var timesheetData = {
    rows: null,
    dragstartrow: 0,
    dragstartcolumn: 0,
    dragmaxrow: null,
    dragmaxcolumn: null,
    updated: null,
    date: null,
    activities: [], // id,from,to (both in minutes from midnight)
    cache: [24*4],
    Start: function () {
        timesheetData.dragmaxrow = timesheetData.dragstartrow;
        timesheetData.dragmaxcolumn = timesheetData.dragstartcolumn;
        var k = 0;
        for (var i=0;i<24;i++)
            for (var j=1;j<5;j++)
                timesheetData.cache[k++] = $(timesheetData.rows[i].children[j]).css("background-color");
    },
    Restore: function(e, me) {
        e.stopPropagation();
        if (timesheetData.dragstartcolumn === 0) return;                     // column 0 clicked, no action

        var column = $(me).parent().children().index(me);
        var row = $(me).parent().parent().children().index(me.parentNode);
        var saverow = row;
        var savecol = column;

        if (row < timesheetData.dragmaxrow || (row === timesheetData.dragmaxrow && column < timesheetData.dragmaxcolumn)) {
            // reduce and restore..
            if (saverow <= timesheetData.dragmaxrow) {
                saverow = timesheetData.dragmaxrow;
                savecol = timesheetData.dragmaxcolumn;
            }
            for (; timesheetData.dragmaxrow >= row; timesheetData.dragmaxrow--) {
                var mincol = (row === timesheetData.dragmaxrow) ? savecol : 1;
                for (; column >= mincol;column--)
                    $(timesheetData.rows[timesheetData.dragmaxrow].children[column]).css("background-color", timesheetData.cache[(timesheetData.dragmaxrow * 4) + column - 1]);
                column = 5;
            }
        } else {
            // extend..
            for (; row > timesheetData.dragmaxrow; timesheetData.dragmaxrow++) {
                while (column < 5)
                    $(timesheetData.rows[timesheetData.dragmaxrow].children[column++]).css("background-color", timesheet.colour);
                column = 1;
            }
            while (column < timesheetData.dragmaxcolumn)
                $(timesheetData.rows[timesheetData.dragmaxrow].children[column++]).css("background-color", timesheet.colour);
        }
        timesheetData.dragmaxrow = saverow;
        timesheetData.dragmaxcolumn = savecol;
    },


    WriteActivityToPage: function (fromRow,toRow,fromCol,toCol,colour) {
        while (fromRow < toRow) {
            while (fromCol++ < 5) 
                $(timesheetData.rows[fromRow].children[fromCol]).css("background-color",colour);
            fromCol = 0;
            fromRow++;
        }
        if (fromRow === toRow) {
            while (fromCol++ < toCol) 
                $(timesheetData.rows[fromRow].children[fromCol]).css("background-color",colour);
        }
    },
    ToPage: function (sheet) {
        var row = 0;
        var col = 0;

        for (var i = 0; i < sheet.entries.length; i++) {      // for each entry...
            var start = sheet.entries[i].startMinutes;
            var startrow = Math.floor(start / 60);                      // write blank space (if any) before activity starts
            var startcol = Math.floor((start%60)/ 15);
            timesheetData.WriteActivityToPage(row, startrow, col, startcol, 'white');

            start += sheet.entries[i].lengthMinutes;
            row = Math.floor(start / 60);                               // now write activity itself
            col = Math.floor((start % 60) / 15);
            var colour = timesheet.GetColourFromActivity(sheet.entries[i].activityId);
            timesheetData.WriteActivityToPage( startrow, row, startcol, col, colour);
        }
        timesheetData.WriteActivityToPage(row, 23, col, 5, 'white');    // finally blank any unassigned time at end of day 
        timesheetData.updated = new Date().getTime();
    },

    ReadActivityFromPage: function (activity,row,col) {
        if (activity) {
            activity.to = (row * 60) + ((col - 1) * 15);
            timesheet.currentTimesheet.push(activity);
        }
    },
    FromPage: function () {
        //if (!timesheetData.dirty) return;
        timesheet.currentTimesheet = [];
        var colour = 0;
        var activity = null;
        
        for (var row = 0;row<23;row++)
            for (var col = 1; col < 5; col++) {
                var chkColour = $(timesheetData.rows[row].children[col]).css("background-color");
                if (colour !== chkColour) {
                    timesheetData.ReadActivityFromPage(activity, row, col);
                    if (colour === 0)
                        activity = null;
                    else
                        activity = { colour: timesheet.GetActivityFromColour(chkColour), from: (row * 60) + ((col - 1) * 15) };
                    colour = chkColour;
                }
            }
        timesheet.Synchronise();
    }
};


///////////////////////////////////////////////////////////////////////////
// main code
///////////////////////////////////////////////////////////////////////////
var timesheet = {
    loggedIn: false,
    clientKey: null,
    username: null,
    currentColour: 'white',
    currentDate: null,
    currentTimesheet: null,
    lastsync: 0,
    lastupdated: 0,

    sync: { timesheets: [], activities: [] },

    // main Synchronise function using WebAPI
    Synchronise: function () {
        var sync = { timesheets: [], activities: [] };
        timesheet.sync.activities.forEach(function (item) { if (item.id > timesheet.lastupdated) sync.activities.push(item); })
        timesheet.sync.timesheets.forEach(function (item) { if (item.id > timesheet.lastupdated) sync.timesheets.push(item); })

        $.ajax({
            type: 'POST',
            cache: false,
            data: { '': JSON.stringify(timesheet.sync) },
            url: "../api/Synchronise",
        }).done(function (result) {
            $('#offline').attr("src", "../../Images/online.jpg");
            timesheet.sync.activities.length = 0;
            timesheet.sync.timesheets.length = 0;
            var sync = JSON.parse(result);
            if (sync.activities) {
                timesheet.sync.activities.length = 0;
                sync.activities.forEach(function (item) {
                    timesheet.sync.activities.push(item);
                });
                timesheet.sync.activities.sort(function (a, b) { return a.name - b.name });
                timesheet.LoadActivities();
            }
            if (sync.timesheets.length > 0) {
                sync.timesheets.forEach(function (item) {
                    timesheet.sync.timesheets[timesheet.FormatDate(new Date(item.when))] = item;
                });
                timesheet.LoadTimesheet(timesheet.currentDate);
            }
         }).error(function (request, status, error) {
             $('#offline').attr("src", "../../Images/offline.png");
         });
    },

    // main authentication, uses client-side usernaclientKey/password hash if offline 
    Authenticate: function (username, password) {
        username = username.toUpperCase();                                      // users can get a bit careless about case when using emails as usernames
        $.ajax({
            type: 'GET',
            cache: false,
            data: 'username=' + username + '&password=' + password,
            url: "../api/Authentication",
        }).done(function (result) {
            if (!result) {
                alert(langReplace("ServerError"));                              // an exception has been thrown at the server
                return;
            } else if (!result.clientKey) {                                     // invalid username
                alert(langReplace("BadUser"));                                  // note we let the server determine this
                return;                                                         // (otherwise we would not be able to switch users for testing)
            }
            $('#offline').attr("src", "../../Images/online.jpg");
            timesheet.clientKey = result.clientKey;
            Crypto.EncryptToLocalStorage("clientKey", timesheet.clientKey, password);   // clientKey is now encrypted in local storage (password is key)

            localStorage.removeItem("loginHash"); // explicit remove for iPad
            localStorage.loginHash = CryptoJS.SHA3(username + password);

            localStorage.removeItem("version");             // explicit remove for iPad
            localStorage.version = result.version;

            timesheet.OnGoodLogin(true, password);
            timesheet.Synchronise();

        }).error(function (request, status, error) {
            $('#offline').attr("src", "../../Images/offline.png");
            if (localStorage.username.toUpperCase() != username) { 
                alert(langReplace("BadUser"));
                return;
            }
            var hash = CryptoJS.SHA3(username + password);
            var loginHash = localStorage.loginHash;
            var authenticated = false;
            try {
                timesheet.clientKey = Crypto.DecryptFromLocalStorage("clientKey", password);
                authenticated = (timesheet.clientKey && hash == loginHash);
            } catch (c) { }

            if (authenticated) {
                timesheet.OnGoodLogin(false, password);
            }
        });
    },
    // either online or offline login succeeds
    OnGoodLogin: function (online, password) {
        timesheet.loggedIn = true;
        timesheet.LoadFromLocalStorage(password);

        // and launch
        $("#page0").hide();
        $("#page1").show();
    },

    OnLogout: function () {
        timesheet.loggedIn = false;
        $("#page0").show();
        $("#page1").hide();
    },

    LoadFromLocalStorage: function (password) {
        var sync = Crypto.DecryptFromLocalStorage('sync', timesheet.clientKey);
        if (sync) timesheet.sync = sync;
        var timesheets = Crypto.DecryptFromLocalStorage('timesheets', timesheet.clientKey);
        if (timesheets) timesheet.sync.timesheets = timesheets;
        var activities = localStorage.getItem(activities);
        if (activities)  timesheet.sync.activities = Json.parse(activities);

        timesheet.LoadActivities();
        timesheet.LoadTimesheet(new Date()); // always start from today
    },

    FormatDate: function (now) {    // return MM/dd/yyyy (parseable using new Date(x))
        return (now.getMonth() + 1) + '/' + now.getDate() + '/' + now.getFullYear();
    },

    LoadTimesheet: function (today) {
        timesheet.currentDate = today;
        var datekey = timesheet.FormatDate(timesheet.currentDate);
        timesheet.currentTimesheet = timesheet.sync.timesheets[datekey];
        if (!timesheet.currentTimesheet) { 
            timesheet.currentTimesheet = { id: new Date().getTime(), when: today, entries: [] }; // today.setHours(0, 0, 0, 0); ????
            timesheet.sync.timesheets[datekey] = timesheet.currentTimesheet;
        }
        timesheetData.ToPage(timesheet.currentTimesheet);
    },

    LoadActivities: function () {
        var mySelect = $('#activities');
        mySelect.empty();
        timesheet.sync.activities.forEach(
            function (item) {
                if (!item.deleted) {
                    mySelect.append($('<option></option>').val(item.id).html(item.name).css('backgroundColor', item.colour));
                }
            });
        mySelect.append($('<option></option>').val(0).html('unselected').css('backgroundColor', 'white').css('color', 'black'));
        timesheet.currentColour = $('#activities :selected').css('backgroundColor');
        mySelect.css('backgroundColor', timesheet.currentColour);
        mySelect.change(function (e) {
            timesheet.currentColour = $('#activities :selected').css('backgroundColor');
            mySelect.css('backgroundColor', timesheet.currentColour);
        });
    },

    SubmitOnEnter: function () {
        $("input").bind("keydown", function (event) {
            var keycode = (event.keyCode ? event.keyCode : (event.which ? event.which : event.charCode));
            if (keycode == 13) {                // keycode for enter key
                $('[name="submit"]').click();   // force the 'Enter Key' to implicitly click the submit button
                return false;
            }
            return true;
        });
    },

    GetActivityFromColour: function (colour) {
        for (var i = 0; i < timesheet.sync.activities.length; i++) if (timesheet.sync.activities[i].colour === colour) return timesheet.sync.activities[i].id;
        return 0;
    },
    GetColourFromActivity: function (activity) {
        for (var i = 0; i < timesheet.sync.activities.length; i++) if (timesheet.sync.activities[i].id === activity) return timesheet.sync.activities[i].colour;
        return 'white';
    },

};
///////////////////////////////////////////////////////////////////////////
// if multiple pages exist, you may need different initialisers when loaded
///////////////////////////////////////////////////////////////////////////
$(document).ready(function () {
    if (localStorage.clientKey && sessionStorage.password)                   
        timesheet.clientKey = Crypto.DecryptFromLocalStorage("clientKey");

    if (localStorage.rememberMe) {
        $("#rememberMe").prop('checked', true);
        $("#username").val(localStorage.username);
    }
    $("#password").focus();

    if (localStorage.version)
        $("#version").text(localStorage.version);

    $('.date').datepicker({
        //format: "dd/mm/yyyy",
        language: "en-GB",
        startDate: "02/01/2015",
        endDate: "0",
        todayBtn: true,
        autoclose: true,
        todayHighlight: true
    }).on("changeDate", function (e) {
        timesheet.LoadTimesheet($('.date').datepicker('getDate'));
    });

    $('.date').val(new Date().toLocaleDateString());

    if (sessionStorage.loggedIn) {
        timesheet.sync.activities = JSON.parse(localStorage.activities);
        timesheet.LoadActivities();
        $("#page0").hide();
        $("#page1").show();
    }

    timesheetData.rows = $('table#schedule').find('tbody').find('tr'); // preload and cache
    timesheet.SubmitOnEnter();                                         // ENTER key initiates a submit

});


