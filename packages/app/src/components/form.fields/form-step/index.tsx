import React, { useRef, Fragment, useEffect } from 'react'
import {
  createControllerBox,
  ISchemaVirtualFieldComponentProps,
  createEffectHook,
  useFormEffects,
  useFieldState,
  IVirtualBoxProps
} from '@formily/react-schema-renderer'
import { toArr } from '@formily/shared'
import { Steps } from 'antd'
import { createMatchUpdate } from '../shared'
import { IFormStep } from '../types'

enum StateMap {
  ON_FORM_STEP_NEXT = 'onFormStepNext',
  ON_FORM_STEP_PREVIOUS = 'onFormStepPrevious',
  ON_FORM_STEP_GO_TO = 'onFormStepGoto',
  ON_FORM_STEP_CURRENT_CHANGE = 'onFormStepCurrentChange',
  ON_FORM_STEP_DATA_SOURCE_CHANGED = 'onFormStepDataSourceChanged'
}
const EffectHooks = {
  onStepNext$: createEffectHook<void>(StateMap.ON_FORM_STEP_NEXT),
  onStepPrevious$: createEffectHook<void>(StateMap.ON_FORM_STEP_PREVIOUS),
  onStepGoto$: createEffectHook<void>(StateMap.ON_FORM_STEP_GO_TO),
  onStepCurrentChange$: createEffectHook<{
    value: number
    preValue: number
  }>(StateMap.ON_FORM_STEP_CURRENT_CHANGE)
}

type ExtendsProps = StateMap & typeof EffectHooks

export const FormStep: React.FC<IVirtualBoxProps<IFormStep>> &
  ExtendsProps = createControllerBox<IFormStep>(
  'step',
  ({
    form,
    schema,
    path,
    name,
    children
  }: ISchemaVirtualFieldComponentProps) => {
    const { dataSource, ...stepProps } = schema.getExtendsComponentProps()
    const [{ current }, setFieldState] = useFieldState({
      current: stepProps.current || 0
    })
    const ref = useRef(current)
    const itemsRef = useRef([])
    itemsRef.current = toArr(dataSource)

    const matchUpdate = createMatchUpdate(name, path)

    const update = (cur: number) => {
      form.notify(StateMap.ON_FORM_STEP_CURRENT_CHANGE, {
        path,
        name,
        value: cur,
        preValue: current
      })
      setFieldState({
        current: cur
      })
    }

    useEffect(() => {
      form.notify(StateMap.ON_FORM_STEP_DATA_SOURCE_CHANGED, {
        path,
        name,
        value: itemsRef.current
      })
    }, [itemsRef.current.length])

    useFormEffects(($, { setFieldState }) => {
      const updateFields = () => {
        itemsRef.current.forEach(({ name }, index) => {
          setFieldState(name, (state: any) => {
            state.display = index === current
          })
        })
      }
      updateFields()
      $(StateMap.ON_FORM_STEP_DATA_SOURCE_CHANGED).subscribe(
        ({ name, path }) => {
          matchUpdate(name, path, () => {
            updateFields()
          })
        }
      )

      $(StateMap.ON_FORM_STEP_CURRENT_CHANGE).subscribe(
        ({ value, name, path }: any = {}) => {
          matchUpdate(name, path, () => {
            form.hostUpdate(() => {
              itemsRef.current.forEach(({ name }, index) => {
                if (!name)
                  throw new Error(
                    'FormStep dataSource must include `name` property'
                  )
                setFieldState(name, (state: any) => {
                  state.display = index === value
                })
              })
            })
          })
        }
      )

      $(StateMap.ON_FORM_STEP_NEXT).subscribe(({ name, path }: any = {}) => {
        matchUpdate(name, path, () => {
          form.validate().then(({ errors }) => {
            if (errors.length === 0) {
              update(
                ref.current + 1 > itemsRef.current.length - 1
                  ? ref.current
                  : ref.current + 1
              )
            }
          })
        })
      })

      $(StateMap.ON_FORM_STEP_PREVIOUS).subscribe(
        ({ name, path }: any = {}) => {
          matchUpdate(name, path, () => {
            update(ref.current - 1 < 0 ? ref.current : ref.current - 1)
          })
        }
      )

      $(StateMap.ON_FORM_STEP_GO_TO).subscribe(
        ({ name, path, value }: any = {}) => {
          matchUpdate(name, path, () => {
            if (!(value < 0 || value > itemsRef.current.length)) {
              update(value)
            }
          })
        }
      )
    })
    ref.current = current
    return (
      <Fragment>
        <Steps {...stepProps} current={current}>
          {itemsRef.current.map((props, key) => {
            return <Steps.Step {...props} key={key} />
          })}
        </Steps>{' '}
        {children}
      </Fragment>
    )
  }
) as any

Object.assign(FormStep, StateMap, EffectHooks)

export default FormStep
