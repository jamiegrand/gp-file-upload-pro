import * as Plupload from 'plupload';

declare global {
    interface Window {
        jQuery: JQueryStatic
        GPFUP_NONCE: string
        GPFUP_AJAX_URL: string
        gfMultiFileUploader: {
            uploaders: { [name: string]: Plupload.Uploader }
            setup: Function
            toggleDisabled: Function
        }
        gformDeleteUploadedFile: (formId: string, fieldId: string, deleteButton: HTMLElement) => void
        mOxie: any
        gform_gravityforms: {
            strings: { [string: string]: string }
        }
        gform: any
        GPFUP_STRINGS: {
            [string: string]: string
        }
    }

    interface GPFUPFieldInitSettings {
        formId: number
        fieldId: number
        enableCrop: boolean
    }
}
