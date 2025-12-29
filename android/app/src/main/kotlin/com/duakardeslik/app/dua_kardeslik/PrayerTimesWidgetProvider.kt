package com.duakardeslik.app.dua_kardeslik

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.SharedPreferences
import android.widget.RemoteViews
import android.text.format.DateFormat
import java.text.SimpleDateFormat
import java.util.*

class PrayerTimesWidgetProvider : AppWidgetProvider() {
    
    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onReceive(context: Context, intent: android.content.Intent) {
        super.onReceive(context, intent)
        val appWidgetManager = AppWidgetManager.getInstance(context)
        val appWidgetIds = appWidgetManager.getAppWidgetIds(
            android.content.ComponentName(context, PrayerTimesWidgetProvider::class.java)
        )
        onUpdate(context, appWidgetManager, appWidgetIds)
    }

    private fun updateAppWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        val prefs: SharedPreferences = context.getSharedPreferences(
            "flutter.home_widget",
            Context.MODE_PRIVATE
        )

        val nextPrayerName = prefs.getString("nextPrayerName", "Namaz Vakti")
        val nextPrayerTime = prefs.getString("nextPrayerTime", "--:--")
        val locationName = prefs.getString("locationName", "")
        val timeRemaining = prefs.getString("timeRemaining", "")

        val layoutId = context.resources.getIdentifier("prayer_times_widget", "layout", context.packageName)
        val views = RemoteViews(context.packageName, layoutId)

        val prayerNameId = context.resources.getIdentifier("widget_prayer_name", "id", context.packageName)
        val prayerTimeId = context.resources.getIdentifier("widget_prayer_time", "id", context.packageName)
        val locationId = context.resources.getIdentifier("widget_location", "id", context.packageName)
        val timeRemainingId = context.resources.getIdentifier("widget_time_remaining", "id", context.packageName)

        if (prayerNameId != 0) {
            views.setTextViewText(prayerNameId, nextPrayerName)
        }
        if (prayerTimeId != 0) {
            views.setTextViewText(prayerTimeId, nextPrayerTime)
        }
        
        if (!locationName.isNullOrEmpty() && locationId != 0) {
            views.setTextViewText(locationId, locationName)
        }
        
        if (!timeRemaining.isNullOrEmpty() && timeRemainingId != 0) {
            views.setTextViewText(timeRemainingId, timeRemaining)
        }

        appWidgetManager.updateAppWidget(appWidgetId, views)
    }
}

