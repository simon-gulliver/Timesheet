using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using Timesheet.Models;
using Newtonsoft.Json;

namespace Timesheet.Controllers
{
    [Authorize]
    [AjaxOnlyWebApi]
    public class ActivityController : ApiController
    {
        // dummy list (would normally get from database)
        public static List<Activity> activities = new List<Activity>()
        {
            new Activity () {id=4,name="Laze around",colour="red",deleted=0},  
            new Activity () {id=2,name="Sleep",colour="cyan",deleted=0},
            new Activity () {id=1,name="Work",colour="gold",deleted=0}
        };


       // GET api/<controller>
        public IEnumerable<Activity> Get()
        {
            return activities;
        }

        // GET api/<controller>/5
        public Activity Get(long id)
        {
            return activities.FirstOrDefault(a => a.id == id);
        }

        // POST api/<controller>
        public void Post([FromBody]string jsonValue)
        {
            var activity = JsonConvert.DeserializeObject<Activity>(jsonValue);
            // add in sorted order
            var nearest = activities
               .Select((value, index) => new { value, index })
               .FirstOrDefault(x => string.Compare(x.value.name, activity.name) > 0);

            if (nearest == null)
            {
                activities.Add(activity);
            }
            else
            {
               activities.Insert(nearest.index, activity);
            }
        }

        // DELETE api/<controller>/5
        public void Delete(long id)
        {
            activities.RemoveAll(x => x.id == id);
        }
    }
}