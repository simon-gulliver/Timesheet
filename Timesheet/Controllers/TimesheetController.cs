using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace Timesheet.Controllers
{
    [Authorize]
    [AjaxOnlyWebApi]
    public class TimesheetController : ApiController
    {
        public static List<Timesheet.Models.Timesheet> timesheets = new List<Timesheet.Models.Timesheet>()
        {
            new Timesheet.Models.Timesheet () {id=1,when=DateTime.Today, entries = new List<Timesheet.Models.TimesheetEntry> ()  {
                new Timesheet.Models.TimesheetEntry () {activityId=1, startMinutes = 480, lengthMinutes = 60},
                new Timesheet.Models.TimesheetEntry () {activityId=2, startMinutes = 700, lengthMinutes = 30}}},
            new Timesheet.Models.Timesheet () {id=2,when=DateTime.Today.AddDays(-2), entries = new List<Timesheet.Models.TimesheetEntry> ()  {
                new Timesheet.Models.TimesheetEntry () {activityId=4, startMinutes = 600, lengthMinutes = 30}}}
        };

        // only GET is supported for this API
        public Timesheet.Models.Timesheet Get()
        {
            return new Timesheet.Models.Timesheet ();
        }

    }
}

