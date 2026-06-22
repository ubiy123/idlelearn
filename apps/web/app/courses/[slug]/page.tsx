import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getCourses } from "@/lib/api";

export default async function CoursePage({ params }: { params: { slug: string } }) {
  const courses = await getCourses();
  const course = courses.find((c) => c.slug === params.slug);
  if (!course) notFound();

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold">{course.title}</h1>
      <p className="mt-2 text-muted-foreground">{course.subtitle}</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {Array.from({ length: course.stageCount }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <CardTitle className="text-lg">L{i + 1} 阶段</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">进度</span>
                  <span>0%</span>
                </div>
                <Progress value={0} className="mt-2" />
                <Button className="mt-4" size="sm">进入学习</Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">课程信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="font-medium">领域：</span>{course.domain}</p>
              <p><span className="font-medium">阶段数：</span>{course.stageCount}</p>
              <p><span className="font-medium">预估学时：</span>{course.estimatedHours} 小时</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
