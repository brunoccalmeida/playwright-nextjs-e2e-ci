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
