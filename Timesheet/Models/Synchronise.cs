using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Timesheet.Models
{
    public class Synchronise
    {
        public long lastSynchronisation;
        public Timesheet [] timesheets;
        public Activity  [] activities;
    }
}