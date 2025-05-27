
import CalendarViews from "@/components/calendar/CalendarViews";

const Calendar = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground">
          Manage your schedule, events, and important dates.
        </p>
      </div>
      
      <CalendarViews />
    </div>
  );
};

export default Calendar;
