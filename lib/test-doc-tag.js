/**
 * Test the comment content for the <code>@ngInject</code> doctag.
 * @param {object} comment The comment node
 */
module.exports = function testDocTag(comment) {
  return /@ngInject/i.test(comment.value);
};