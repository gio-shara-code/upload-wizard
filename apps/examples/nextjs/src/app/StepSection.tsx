 import {ReactNode, useMemo} from "react";


interface NumberComponentProps {
    number: number
    done?: boolean
}

const NumberComponent = ({ number, done }: NumberComponentProps) => {
    return (
        <div
            className={`text-lg font-bold text-cyan-900 w-6 h-6 flex justify-center items-center rounded-full ${
                done ? 'bg-green-500' : 'bg-white'
            }`}
        >
            {done ? '✓' : number}
        </div>
    )
}

interface Props {
    number: number
    active: boolean
    done?: boolean
    children: (disabled: boolean) => ReactNode
}

export default function StepSection ({ children, number, active, done }: Props){
    const disabled = useMemo(() => {
        return !active
    }, [active])

    return (
        <section className={'flex items-start gap-4'}>
            <div
                aria-disabled={done ? false : disabled}
                className={
                    'aria-disabled:opacity-50 aria-disabled:pointer-events-none'
                }
            >
                <NumberComponent number={number} done={done} />
            </div>
            <div
                aria-disabled={disabled}
                className={`transition-[max-height] duration-500 overflow-y-auto aria-disabled:opacity-50 aria-disabled:pointer-events-none`}
            >
                {children(disabled)}
            </div>
        </section>
    )
}
