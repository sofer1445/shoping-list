
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

    // Items by day (mock data for demonstration)
    const dailyData = [
      { day: 'א', items: Math.floor(Math.random() * 10) + 5 },
      { day: 'ב', items: Math.floor(Math.random() * 10) + 5 },
      { day: 'ג', items: Math.floor(Math.random() * 10) + 5 },
      { day: 'ד', items: Math.floor(Math.random() * 10) + 5 },
      { day: 'ה', items: Math.floor(Math.random() * 10) + 5 },
      { day: 'ו', items: Math.floor(Math.random() * 10) + 5 },
      { day: 'ש', items: Math.floor(Math.random() * 10) + 5 },
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
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">סה"כ פריטים</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              ברשימה הנוכחית
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">אחוז השלמה</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.completed} מתוך {stats.total}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Distribution */}
      {stats.categoryData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">התפלגות לפי קטגוריות</CardTitle>
            <CardDescription>
              כמות הפריטים בכל קטגוריה
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={stats.categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
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

      {/* Daily Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">פעילות שבועית</CardTitle>
          <CardDescription>
            כמות הפריטים שנוספו בכל יום
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="items" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Items */}
      {stats.topItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              הפריטים הפופולריים ביותר
            </CardTitle>
            <CardDescription>
              המוצרים שמופיעים הכי הרבה ברשימות שלך
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topItems.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold">
                      {index + 1}
                    </span>
                    <span>{item.name}</span>
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
