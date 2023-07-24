import React from 'react';
import {ButtonProps} from "@components/types/generic";

export default function PrimaryButton ({ children, disabled }: ButtonProps)  {
    return (
        <button
            className={`bg-orange-300 hover:bg-orange-100 text-gray-800 py-1 px-2 rounded-full disabled:bg-gray-300 disabled:text-gray-500`}
            disabled={disabled}
        >
            {children}
        </button>
    )
}


