import { expect, test } from '../helpers/cms'
import { formSchema, mutationSchema } from '../helpers/cms-contract'
import { expectJson } from '../helpers/expect-json'
import { knownIssue } from '../known-issues'

test.describe('REST API /api/forms', () => {
  test('deletes a form without submissions', async ({ adminRequest, createForm }) => {
    const form = await createForm()

    const response = await adminRequest.delete(`/api/forms/${String(form.id)}`)

    await expectJson(response, 200, mutationSchema(formSchema))
  })

  // Proves submitForm outside the test.fail below, which would accept it breaking
  test('stores a submission against its form', async ({ createForm, submitForm }) => {
    const form = await createForm()

    const submission = await submitForm(form.id)

    // The create response populates the form
    expect(submission).toMatchObject({
      form: { id: form.id },
      submissionData: [{ field: 'email', value: 'a@example.com' }],
    })
  })

  test.fail(
    'deleting a form that has submissions is not a server error',
    knownIssue('KI-9'),
    async ({ adminRequest, createForm, submitForm }) => {
      const form = await createForm()
      await submitForm(form.id)

      const response = await adminRequest.delete(`/api/forms/${String(form.id)}`)

      // Deleting it or refusing with a 4xx that says why are both correct
      expect(response.status()).toBeLessThan(500)
    },
  )
})
