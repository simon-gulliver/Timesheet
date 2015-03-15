using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using Newtonsoft.Json;

namespace Timesheet.Controllers
{
    [Authorize]
    [AjaxOnlyWebApi]
    public class SynchroniseController : ApiController
    {
        // only POST is supported for this API
        public string Post([FromBody]string json)
        {
            var sync = JsonConvert.DeserializeObject<Timesheet.Models.Synchronise>(json);
            UpdateActivities(sync.activities);
            UpdateTimesheets(sync.timesheets);

            var newsheets = TimesheetController.timesheets.Where(x => x.entries.Any(e => e.activityId > sync.lastSynchronisation)).ToList().ToArray();
            var newactivities = (ActivityController.activities.Any(x => x.id > sync.lastSynchronisation)) 
                ? ActivityController.activities.ToArray() : null;
            
            sync = new Timesheet.Models.Synchronise() { activities = newactivities, timesheets = newsheets, lastSynchronisation = DateTime.Now.Ticks };
            return JsonConvert.SerializeObject (sync);        
        }



        private void UpdateActivities(Timesheet.Models.Activity [] activities)
        {
            if (activities != null) return;

            foreach (var activity in activities)
            {
                // add in sorted order
                var nearest = ActivityController.activities
                   .Select((value, index) => new { value, index })
                   .FirstOrDefault(x => (x.value.id - activity.id) >= 0);
                if (nearest == null)
                    ActivityController.activities.Add(activity);
                else
                {
                    if (nearest.value.id == activity.id)
                        ActivityController.activities.RemoveAt(nearest.index);
                    ActivityController.activities.Insert(nearest.index, activity);
                }
            }

        }
        private void UpdateTimesheets(Timesheet.Models.Timesheet [] timesheets)
        {
            foreach (var timesheet in timesheets)
            {
                TimesheetController.timesheets.RemoveAll(t => t.when == timesheet.when);
                TimesheetController.timesheets.Add(timesheet);
            }

        }
    }
}