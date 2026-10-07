import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202610020001_quotation_review_resume_request',
  async up({ builder }) {
    await builder.alterCollection('quotationReviewTasks', (collection) => {
      collection.string('resumeRequestId', { length: 255, nullable: true });
    });
  },
  async down({ builder }) {
    await builder.alterCollection('quotationReviewTasks', (collection) => {
      collection.dropField('resumeRequestId');
    });
  },
});
