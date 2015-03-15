using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Reflection;
using System.Web.Http;
using System.Web.Mvc;
using System.Web.Security;
using Timesheet.Models;

namespace Timesheet.Controllers
{
    public class AuthenticationResponse
    {
        public long lastSynchronisation;
        public string clientKey;            // Guid for encryption of sensitive data on client local storage
        public string version;              // server version
    }

    public class AuthenticationController : ApiController
    {
        public static string clientKey = Timesheet.Helpers.RandomKey.Create();  // create random key (normally, take from database for each valid user)

        [AjaxOnlyWebApi]
        public AuthenticationResponse Get(string username, string password)
        {
            AuthenticationResponse response = null;  
            if (password != "x")                        // "x" is the equivalent of a failed username lookup from the database (x is always bad password!)
            {
                FormsAuthentication.SetAuthCookie(username, false);                                     // authorise API calls

                var maxActivity = ActivityController.activities.Max(a => a.id);                         
                var maxTimesheet = TimesheetController.timesheets.Max(t => t.id);
                var version = Assembly.GetAssembly(typeof(AppController)).GetName().Version.ToString(); 

                response = new AuthenticationResponse()
                {
                    lastSynchronisation = (maxActivity > maxTimesheet) ? maxActivity : maxTimesheet,    // last synchronisation from any device
                    clientKey = clientKey,                                                              // pass back an encryption key for on-device data
                    version = version                                                                   // pass back current software version
                };
            }

            return response;
        }
    }
}