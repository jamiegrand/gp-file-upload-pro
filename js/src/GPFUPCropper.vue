<template>
    <transition name="gpfup__cropper--transition">
        <div v-if="imgSrc && open" class="cropper__lightbox" style="z-index: 99999999;">
            <cropper
                    class="cropper"
                    :src="imgSrc"
                    ref="cropper"
                    :default-size="defaultSize"
                    :default-position="defaultPosition"
            />

            <button
                    class="gpfup__cancel"
                    @click.prevent="cancel"
                    v-shortkey="['esc']"
                    @shortkey.prevent="cancel()"
            >
                {{ strings.cancel }}
            </button>

            <button class="gpfup__crop" @click.prevent="crop">
                {{ strings.crop }}
            </button>
        </div>
    </transition>
</template>

<script lang="ts">
    // @ts-ignore
    import {Cropper} from 'vue-advanced-cropper';
    import Vue from 'vue';
    import {canvasToBlob} from "blob-util";
    import {mapState} from "vuex";
    import deleteFileFromHiddenGFInput from "./helpers/deleteFileFromHiddenGFInput";
	import sortHidddenGFInput from "./helpers/sortHidddenGFInput";

    const $ = window.jQuery;

    Vue.use(require('vue-shortkey'));

    export default Vue.extend({
        name: "GPFUPCropper",
        props: ['open', 'file', 'up', 'formId', 'fieldId'],
        data: function () {
            return {
                strings: {
                    ...window.gform_gravityforms.strings,
                    ...window.GPFUP_STRINGS,
                },
            };
        },
        components: {
            Cropper
        },
        computed: {
            imgSrc: function () : string {
                return this.$store.getters.imgSrc;
            },
            ...mapState({
                currentFile: (state: any) => state.editor.currentFile,
            }),
        },
        methods: {
            defaultSize: function (): { width: number, height: number } {
                return this.$store.getters.imgSize;
            },
            defaultPosition: function (): { top: number, left: number } {
                return this.$store.getters.imgPos;
            },
            crop: function () : void {
                const {coordinates, canvas} : { coordinates: Coords, canvas: HTMLCanvasElement } =
                    (this.$refs.cropper as any).getResult();

                if (!canvas) {
                    return;
                }

                let blobImageType = 'image/png';

                if (['image/jpg', 'image/jpeg'].includes(this.currentFile?.type)) {
                    blobImageType = 'image/jpeg';
                }

                canvasToBlob(canvas, blobImageType).then((blob) => {
                    /* Create new file object for Plupload using blob and update file name */
                    const file = new window.mOxie.File(null, blob);
                    file.name = this.currentFile?.name;

                    /* Add cropped to Plupload */
                    this.up.addFile(file);

                    /* Remove original file from GF */
                    const currentFileEl = $(`[data-file-id="${this.currentFile?.id}"]`);

                    if (currentFileEl.length) {
                        deleteFileFromHiddenGFInput(this.formId, this.fieldId, this.currentFile);
                    }

                    const newFile = this.up.files[this.up.files.length - 1];

                    this.$store.commit('REPLACE_FILE', {
						replacedFile: this.currentFile,
						newFile,
					});

                    /* Remove original file. Ordering is important here as we need to do it after REPLACE_FILE */
					this.up.removeFile(this.currentFile?.id);

					/* Transfer original */
					this.$store.dispatch('transferOriginal', {
						currentFileId: this.currentFile?.id,
						newFileId: newFile.id,
					})

                    /* Remove original file from Gravity Forms UI */
                    const fileIndexUI = $(`#${this.currentFile?.id}`).index();
                    const $field = $("#field_" + this.formId + "_" + this.fieldId);

                    $field.find(".ginput_preview").eq(fileIndexUI).remove();

                    /* Set cropped flag to prevent infinite loop */
                    newFile.cropped = true;
					newFile.addedDate = new Date(this.currentFile?.addedDate.getTime());

                    this.$store.dispatch('storeCroppedCoords', {
                      fileId: newFile.id,
                      coords: coordinates,
                    });

                    this.$store.dispatch('storeImagePreview', {
                        fileId: newFile.id,
                        blob
                    });
                });

                this.$store.commit('CLOSE_EDITOR');
            },
            cancel: function () {
                this.$store.commit('CLOSE_EDITOR');
            },
        }
    });
</script>

<style>
    .cropper__lightbox {
        background: rgba(0, 0, 0, .90);
        position: fixed;
        z-index: 10000;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        padding: 10vh;
    }

    .cropper {
        width: 100%;
        height: 100%;
    }

    .cropper__lightbox button {
        position: absolute;
        top: 20px;
        font-size: 16px;
        background: #56488f;
        padding: 10px 30px;
        border: 0;
        border-radius: 2px;
        color: white;
    }

    button.gpfup__crop {
        right: 20px;
    }

    button.gpfup__cancel {
        background: #666;
        left: 20px;
    }

    .vue-handler-wrapper--south,
    .vue-handler-wrapper--north {
        cursor: ns-resize;
    }

    .vue-handler-wrapper--west,
    .vue-handler-wrapper--east {
        cursor: ew-resize;
    }

    .vue-handler-wrapper--east-north,
    .vue-handler-wrapper--west-south {
        cursor: nesw-resize;
    }

    .vue-handler-wrapper--east-south,
    .vue-handler-wrapper--west-north {
        cursor: nwse-resize;
    }

    /*.vue-advanced-cropper__area[style] {*/
    /*    transition: all .3s ease-in-out !important;*/
    /*}*/

    .gpfup__cropper--transition-enter {
        opacity: 0;
    }

    .gpfup__cropper--transition-enter-active {
        transition: opacity .3s ease-out;
    }

    .gpfup__cropper--transition-enter-to {
        opacity: 1;
    }

    .gpfup__cropper--transition-leave-active {
        transition: opacity .3s ease-out;
    }

    .gpfup__cropper--transition-leave-to {
        opacity: 0;
    }

</style>
