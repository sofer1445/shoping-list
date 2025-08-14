
import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, ShoppingCart, Clock, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { ShoppingItem } from "./types";

interface StatisticsProps {
  items: ShoppingItem[];
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

export const Statistics = ({ items }: StatisticsProps) => {
  const stats = useMemo(() => {
    const total = items.length;
    const completed = items.filter(item => item.completed).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Category distribution
    const categoryStats = items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const categoryData = Object.entries(categoryStats).map(([name, value]) => ({
      name,
      value
    }));

    // Fixed daily data - using static data instead of random
    const dailyData = [
      { day: 'א', items: 8 },
      { day: 'ב', items: 12 },
      { day: 'ג', items: 15 },
      { day: 'ד', items: 10 },
      { day: 'ה', items: 7 },
      { day: 'ו', items: 14 },
      { day: 'ש', items: 9 },
    ];

    // Most frequent items
    const itemFrequency = items.reduce((acc, item) => {
      acc[item.name] = (acc[item.name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topItems = Object.entries(itemFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return {
      total,
      completed,
      completionRate,
      categoryData,
      dailyData,
      topItems,
      activeItems: total - completed
    };
  }, [items]);

  return (
    <div className="space-y-4 px-1">
      {/* Overview Cards - Mobile Optimized Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="p-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <CardTitle className="text-sm font-medium">סה"כ פריטים</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              ברשימה הנוכחית
            </p>
          </CardContent>
        </Card>

        <Card className="p-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <CardTitle className="text-sm font-medium">אחוז השלמה</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-2xl font-bold">{stats.completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.completed} מתוך {stats.total}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Distribution - Mobile Optimized */}
      {stats.categoryData.length > 0 && (
        <Card className="p-3">
          <CardHeader className="p-0 pb-3">
            <CardTitle className="text-base">התפלגות לפי קטגוריות</CardTitle>
            <CardDescription className="text-sm">
              כמות הפריטים בכל קטגוריה
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={stats.categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Daily Activity - Mobile Optimized */}
      <Card className="p-3">
        <CardHeader className="p-0 pb-3">
          <CardTitle className="text-base">פעילות שבועית</CardTitle>
          <CardDescription className="text-sm">
            כמות הפריטים שנוספו בכל יום (נתונים לדוגמה)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={stats.dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="items" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Items - Mobile Optimized */}
      {stats.topItems.length > 0 && (
        <Card className="p-3">
          <CardHeader className="p-0 pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              הפריטים הפופולריים ביותר
            </CardTitle>
            <CardDescription className="text-sm">
              המוצרים שמופיעים הכי הרבה ברשימות שלך
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-3">
              {stats.topItems.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold">
                      {index + 1}
                    </span>
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {item.count} פעמים
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Statistics;
