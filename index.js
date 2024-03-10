const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");

dotenv.config();

const app = express();
mongoose.set('strictQuery', false);

// init mongoose
mongoose.connect(process.env.MONGO_URI);

const con = mongoose.connection;
con.on("open", (error) => {
  if (!error) {
    console.log("DB connection successful");
  } else {
    console.log(`DB connection failed with error: ${error}`);
  }
});

const domainsFromEnv = process.env.CORS_DOMAINS || "";
const whitelist = domainsFromEnv.split(",").map((item) => item.trim());
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not Allowed by CORS"));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));

const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(cookieParser());

app.use("/admin_blog", require("./routes_admin/blog"));
app.use("/admin_events", require("./routes_admin/events"));
app.use("/admin_gallery", require("./routes_admin/gallery"));
app.use("/admin_book", require("./routes_admin/book"));
app.use("/admin_staff", require("./routes_admin/staff"));
app.use("/admin_session", require("./routes_admin/session"));
app.use("/admin_vlog", require("./routes_admin/vlog"));
app.use("/admin_subject", require("./routes_admin/subject"));
app.use("/admin_auth", require("./routes_admin/auth"));
app.use("/master_admin", require("./routes_admin/master_admin"));
app.use("/admin_faqs", require("./routes_admin/faqs"));
app.use("/admin_registration", require("./routes_admin/registration"));
app.use("/admin_category", require("./routes_admin/category"));
app.use("/admin_product", require("./routes_admin/product"));
app.use("/admin_requests", require("./routes_admin/requests"));
app.use("/admin_center", require("./routes_admin/center"));
app.use("/admin_clas", require("./routes_admin/clas"));
app.use("/admin_statistics", require("./routes_admin/statistics"));
app.use("/admin_students", require("./routes_admin/students"));
app.use("/admin_additional_resources", require("./routes_admin/additional_resources"));
app.use("/admin_vlog_category", require("./routes_admin/vlog_category"));
app.use("/admin_profile", require("./routes_admin/profile"));
app.use("/admin_school", require("./routes_admin/school"));
app.use("/admin_video_learning", require("./routes_admin/video_learning"));
app.use("/admin_payment", require("./routes_admin/payment"));
app.use("/admin_result", require("./routes_admin/result"));
app.use("/admin_featured_video", require("./routes_admin/featured_video"));
app.use("/admin_store", require("./routes_admin/store"));
app.use("/admin_store_requests", require("./routes_admin/store_requests"));
app.use("/admin_settings", require("./routes_admin/settings"));
app.use('/admin_view_ops', require('./routes_admin/view_ops'));
app.use('/admin_chat', require('./routes_admin/chat'));

app.use("/guardian_chat", require("./routes_guardian/chat"));

app.use("/student_blog", require("./routes_student/blog"));
app.use("/student_events", require("./routes_student/events"));
app.use("/student_gallery", require("./routes_student/gallery"));
app.use("/student_profile", require("./routes_student/profile"));
app.use("/student_class_video", require("./routes_student/class_video"));
app.use(
  "/student_continous_assessment",
  require("./routes_student/continous_assessment")
);
app.use("/student_result", require("./routes_student/result"));
app.use("/student_auth", require("./routes_student/auth"));
app.use("/student_registration", require("./routes_student/registration"));
app.use("/student_product", require("./routes_student/product"));
app.use("/student_requests", require("./routes_student/requests"));
app.use("/student_video_learning", require("./routes_student/video_learning"));
app.use("/student_comment", require("./routes_student/comment"));
app.use("/student_likes", require("./routes_student/likes"));
app.use("/student_featured_video", require("./routes_student/featured_video"));
app.use("/student_payment_code", require("./routes_student/payment_code"));
app.use("/student_get_in_touch", require("./routes_student/get_in_touch"));

app.use("/teacher_class_video", require("./routes_teacher/class_video"));
app.use(
  "/teacher_continous_assessment",
  require("./routes_teacher/continous_assessment")
);
app.use("/teacher_result", require("./routes_teacher/result"));
app.use("/teacher_profile", require("./routes_teacher/profile"));
app.use("/teacher_worksheet", require("./routes_teacher/worksheet"));
app.use("/teacher_auth", require("./routes_teacher/auth"));
app.use("/teacher_additional_resources", require("./routes_teacher/additional_resources"));
app.use("/teacher_subject", require("./routes_teacher/subject"));
app.use("/teacher_file", require("./routes_teacher/file"));

app.use("/guardian_auth", require("./routes_guardian/auth"));
app.use("/guardian_profile", require("./routes_guardian/profile"));
app.use("/guardian_book", require("./routes_guardian/book"));
app.use("/guardian_subject", require("./routes_guardian/subject"));
app.use("/guardian_profile", require("./routes_guardian/profile"));
app.use("/guardian_vlog", require("./routes_guardian/vlog"));
app.use("/guardian_blog", require("./routes_guardian/blog"));
app.use("/guardian_events", require("./routes_guardian/events"));
app.use("/guardian_news", require("./routes_guardian/news"));
app.use("/guardian_session", require("./routes_guardian/session"));
app.use("/guardian_student", require("./routes_guardian/student"));
app.use("/guardian_search", require("./routes_guardian/search"));
app.use("/guardian_faqs", require("./routes_guardian/faqs"));
app.use("/guardian_continous_assessment", require("./routes_guardian/continous_assessment"));
app.use("/guardian_exam", require("./routes_guardian/exam"));
app.use("/guardian_worksheet", require("./routes_guardian/worksheet"));
app.use("/guardian_notification", require("./routes_guardian/notification"));
app.use("/guardian_gallery", require("./routes_guardian/gallery"));
app.use("/guardian_student_progress", require("./routes_guardian/student_progress"));
app.use("/guardian_result", require("./routes_guardian/result"));
app.use("/guardian_teacher", require("./routes_guardian/teacher"));
app.use("/guardian_additional_resources", require("./routes_guardian/additional_resources"));
app.use("/guardian_avatar", require("./routes_guardian/avatar"));
app.use("/guardian_video_learning", require("./routes_guardian/video_learning"));
app.use("/guardian_comment", require("./routes_guardian/comment"));
app.use("/guardian_likes", require("./routes_guardian/likes"));
app.use("/guardian_chat", require("./routes_guardian/chat"));
app.use("/guardian_newsletter", require("./routes_guardian/subscribe_newsletter"));
app.use('/guardian_store', require('./routes_guardian/store'));

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server started on PORT ${PORT}`));