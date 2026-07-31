import { Form, Input } from '@arco-design/web-react'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { FormPageFrame } from './FormPageFrame'

type TestFormValues = {
  name: string
}

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
})

function TestFormPage({ onCancel, onSubmit }: { onCancel: () => void; onSubmit: (values: TestFormValues) => void }) {
  const [form] = Form.useForm<TestFormValues>()

  return (
    <FormPageFrame<TestFormValues>
      breadcrumbs={[{ label: '实例' }, { label: '创建实例' }]}
      form={form}
      sections={[
        {
          key: 'basic',
          title: '基本信息',
          content: (
            <Form.Item field="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
              <Input aria-label="名称" />
            </Form.Item>
          ),
        },
        { key: 'configuration', title: '配置信息', content: <span>动态配置内容</span> },
      ]}
      actions={[
        { key: 'cancel', label: '取消', onClick: onCancel },
        { key: 'submit', label: '确认', submit: true, buttonProps: { type: 'primary' } },
      ]}
      onSubmit={onSubmit}
    />
  )
}

describe('FormPageFrame', () => {
  it('动态展示分组和按钮，并仅在校验通过后提交', async () => {
    const onCancel = vi.fn()
    const onSubmit = vi.fn()
    const view = render(<TestFormPage onCancel={onCancel} onSubmit={onSubmit} />)

    expect(view.getByRole('heading', { name: '创建实例' })).toBeInTheDocument()
    expect(view.getByRole('heading', { name: '基本信息' })).toBeInTheDocument()
    expect(view.getByRole('heading', { name: '配置信息' })).toBeInTheDocument()
    expect(view.getByTestId('form-page-scroll-area')).toHaveTextContent('动态配置内容')

    fireEvent.click(view.getByRole('button', { name: '确认' }))
    expect(await view.findByText('请输入名称')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()

    fireEvent.change(view.getByRole('textbox', { name: '名称' }), { target: { value: 'container-a' } })
    fireEvent.click(view.getByRole('button', { name: '确认' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ name: 'container-a' }))

    fireEvent.click(view.getByRole('button', { name: '取消' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
