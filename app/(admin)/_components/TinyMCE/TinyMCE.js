'use client'

import { Editor } from '@tinymce/tinymce-react'
import { useRef } from 'react'

export default function TinyMCE({ name = 'content', value = '', onChange }) {
    const editorRef = useRef(null)

    return (
        <Editor
            tinymceScriptSrc="https://cdnjs.cloudflare.com/ajax/libs/tinymce/7.9.1/tinymce.min.js"
            onInit={(evt, editor) => (editorRef.current = editor)}
            value={value}
            // ---- Chuyển (content) -> fake event cho handleFormChange ----
            onEditorChange={(content) => {
                if (typeof onChange === 'function') {
                    onChange({ target: { name, value: content } })
                }
            }}
            init={{
                license_key: 'gpl',
                height: 1000,
                selector: 'textarea#content',

                plugins:
                    'preview importcss searchreplace autolink autosave save directionality code visualblocks visualchars fullscreen image link media table charmap pagebreak nonbreaking anchor insertdatetime advlist lists wordcount help charmap quickbars emoticons accordion',
                toolbar:
                    'undo redo | accordion accordionremove | blocks | bold italic underline strikethrough | align numlist bullist | link image | table media | lineheight outdent indent | forecolor backcolor removeformat | charmap emoticons | code fullscreen preview | save print | pagebreak anchor codesample | ltr rtl',

                autosave_ask_before_unload: true,
                autosave_interval: '30s',
                autosave_prefix: '{path}{query}-{id}-',
                autosave_restore_when_empty: false,
                autosave_retention: '2m',

                skin: (typeof window !== 'undefined' &&
                    window.matchMedia &&
                    window.matchMedia('(prefers-color-scheme: dark)').matches)
                    ? 'oxide-dark'
                    : 'oxide',
                content_css: (typeof window !== 'undefined' &&
                    window.matchMedia &&
                    window.matchMedia('(prefers-color-scheme: dark)').matches)
                    ? 'dark'
                    : 'default',
            }}
        />
    )
}
