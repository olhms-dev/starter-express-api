const mongoose = require('mongoose');

const ResultSchema = mongoose.Schema({
    student_id: String,
    student_name: String,
    student_img_url: String,
    teachers_id: String,
    teachers_name: String,
    head_teachers_name: String,
    class_name: String,
    session: String,
    term: String,
    is_validated: { type: Boolean, default: false },
    is_validated_by: {type: String, default: 'Nil'},
    validated_result_url: {type: String, default: ""},
    validated_result_url_id: {type: String, default: ""},
    validation_date: String,
    teachers_remark: String,
    verdict: String,
    head_teachers_remark: String,
    is_promoted_by: String,
    is_repeated_by: String,
    next_term_fee: String,
    other_fees: String,
    total_fees: String,
    position: Number,
    total_score: {type: Number, default: 0},
    sum_total: String,
    string_total: String,
    average: Number,
    no_of_subjects_passed: { type: Number, default: 0 },
    no_of_subjects_failed: { type: Number, default: 0 },
    attendance_score: String,
    result_summary_remark: String,
    results: [
        {
            subject: String,
            first_ca_theory: { type: Number, default: null },
            first_ca_obj: { type: Number, default: null },
            second_ca_theory: { type: Number, default: null },
            second_ca_obj: { type: Number, default: null },
            exam_theory: { type: Number, default: null },
            exam_obj: { type: Number, default: null },
            total: { type: Number, default: null },
            grade: { type: String, default: 'Nil' },
            remark: {type: String, default: 'Nil'}
        }
    ],
    affective_traits: {
        general_conduct: String,
        assignments: String,
        class_participation: String,
        finishes_work_on_time: String,
        takes_care_of_materials: String,
        working_independently: String
    },
    psycho_motive_traits: {
        regularity: String,
        personal_cleanliness: String,
        punctuality: String,
        completion_of_work: String,
        // disturbing_others: String,
        following_instructions: String
    },
    timestamp: Number,
    is_deleted: { type: Boolean, default: false },
    stage: { type: Number, default: 0 },
    center: String,
    overall_remark: String,
    validator_id: String
}, { collection: 'results' });

const model = mongoose.model('Result', ResultSchema);
module.exports = model;