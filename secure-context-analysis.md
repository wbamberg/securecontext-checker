# Comparing webref and MDN SecureContext values

This documents an attempt to compare the representation of "secure context required" in MDN pages and in the WebIDL in the specifications, as exposed by the webref/idl package.

Some web platform features are only usable in a secure context. This is communicated in WebIDL by a `SecureContext`flag, and in MDN pages by the inclusion of a `SecureContext_Header` macro. This post compares the information in each of these two sources, with a view to understanding whether and how MDN might use the IDL, via the webref/idl package, instead of the macro.

It relies on a tool [securecontext-checker](https://github.com/wbamberg/securecontext-checker). This has its own documentation that I won't describe here: however I'd welcome some review of its code to check I'm not making mistakes. The tool generates two objects:

- one sorts Web/API features into two arrays, `secure` and `notSecure`, based on the presence of the macro in the MDN page source
- one sorts Web/API features into two arrays, `secure` and `notSecure`, based on the presence of the `SecureContext` flag in the IDL.

We then compare both sets of arrays for anomalies:

- items that are marked secure in MDN, but marked not secure in webref
- items that are marked secure in webref, but marked not secure in MDN
- items that are marked secure in MDN, but not listed at all in webref

## Analysis

The full results are given in the "Results" section. Here I'll pick out some of the main points.

### Overview and guide pages

On MDN, overview and guide pages, like [Cookie Store API](https://developer.mozilla.org/en-US/docs/Web/API/Cookie_Store_API) or [Using the Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API/Using_the_Geolocation_API), have the secure context banner. MDN can't use WebIDL for this, because WebIDL only refers to concrete web platform features.

In the interests of simplicity, I think it would fine to stop having secure context banners on these pages. If MDN did want to keep them:

- it could add them manually
- it might be able to derive them from GroupData: say if the interfaces in GroupData are secure context, then the overview page and associated guide pages are secure context too. This might give us some counterintuitive results though.

### Globals

Because MDN doesn't represent globals properly, it can't map IDL structure to our pages on globals. For example, [`caches`](https://developer.mozilla.org/en-US/docs/Web/API/caches) doesn't exist in the WebIDL, where it is defined as an attribute of the `WindowOrWOrkerGlobaslScope` mixin. So MDN can't derive its secure context state from the IDL.

This is another argument for representing globals correctly: https://github.com/orgs/mdn/discussions/360.

### Events

Events don't appear in the IDL either, but MDN treats them as members of interfaces. So, for instance, MDN has a page for the [`devicemotion` event on `Window`](https://developer.mozilla.org/en-US/docs/Web/API/Window/devicemotion_event) which is marked as secure. I've dealt with this by looking for event handler attributes like [`ondevicemotion`](https://w3c.github.io/deviceorientation/#ref-for-dom-window-ondevicemotion) attribute, and mangling the name to match the MDN slug. This seems to work pretty well.

### Nonstandard features

Obviously, nonstandard features are not in the WebIDL, and if MDN wants to mark them secure context, it has to do it manually. For example, [`FileSystemHandle.remove()`](https://developer.mozilla.org/en-US/docs/Web/API/FileSystemHandle/remove). There are not many of these, and the most common source of them seem to be features that were removed from the specs, like [PaymentAddress](https://developer.mozilla.org/en-US/docs/Web/API/PaymentAddress).

### Maplike/setlike/iterable

This is another place where MDN diverges from the WebIDL. WebIDL can mark some interfaces [`setlike`](https://webidl.spec.whatwg.org/#idl-setlike), [`maplike`](https://webidl.spec.whatwg.org/#idl-maplike), or [`iterable`](https://webidl.spec.whatwg.org/#idl-iterable) which implicitly gives them additional members, without representing these members in the WebIDL.

MDN does not represent these features consistently: different interfaces do different things. When an MDN interface represents them by adding the implicit members to the interface, like [`FileSystemDirectoryHandle.entries`](https://developer.mozilla.org/en-US/docs/Web/API/FileSystemDirectoryHandle/entries), then we won't see a corresponding WebIDL entry.

This is related to https://github.com/openwebdocs/project/issues/159, which is about finding a consistent MDN representation for these things.

If MDN did want to model them by adding separate pages, we could update the WebIDL-processing code to synthesise entries for them.

### Editorial choices

There are some places where MDN has chosen to mark as secure context features which are not (technically) secure context, but are (effectively) secure context. This then disagrees with the WebIDL.

For example, [`Geolocation.getCurrentPosition()`](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/getCurrentPosition) does not, technically, require secure context, but because its implementation constructs a `GeolocationPosition` object, and [`GeolocationPosition` does require secure context](https://w3c.github.io/geolocation-api/#position_interface), then `getCurrentPosition()` does effectively require a secure context.

There aren't that many of these cases, and I think it would be OK to stop marking them secure context.

## Results

In this section we'll present the results and add some notes about them.

### Secure context in MDN, not secure context in WebIDL

This lists all features that are marked secure context in MDN, and not marked secure context in WebIDL (but do exist in WebIDL).

<details>

<summary>Click to reveal</summary>

<pre>
ContactAddress
CSPViolationReportBody
ExtendableCookieChangeEvent
GamepadHapticActuator
GamepadPose
GeolocationPositionError
Geolocation
Notification
PerformanceServerTiming
WindowControlsOverlay
XRCPUDepthInformation
XRCompositionLayer
XRCubeLayer
XREquirectLayer
XRCylinderLayer
XRProjectionLayer
XRMediaBinding
XRQuadLayer
XRSubImage
XRWebGLDepthInformation
XRWebGLBinding
XRWebGLSubImage
CSS.paintWorklet_static
DataTransferItem.getAsFileSystemHandle
ExtendableCookieChangeEvent.deleted
ExtendableCookieChangeEvent.changed
ExtendableCookieChangeEvent.ExtendableCookieChangeEvent
GeolocationPositionError.code
GeolocationPositionError.message
Geolocation.getCurrentPosition
Geolocation.clearWatch
Geolocation.watchPosition
IDBTransaction.durability
IDBVersionChangeEvent.IDBVersionChangeEvent
Notification.actions
Notification.body
Notification.close
Notification.close_event
Notification.data
Notification.dir
Notification.error_event
Notification.icon
Notification.image
Notification.click_event
Notification.lang
Notification.maxActions_static
Notification.Notification
Notification.permission_static
Notification.renotify
Notification.requestPermission_static
Notification.requireInteraction
Notification.show_event
Notification.silent
Notification.tag
Notification.timestamp
Notification.title
Notification.vibrate
Notification.badge
Navigator.geolocation
Navigator.getGamepads
PerformanceResourceTiming.serverTiming
</pre>

</details>

I haven't checked all of these, but the ones I have checked just look like errors in MDN - errors that would be fixed if MDN used webref/idl as a source.

### Secure context in WebIDL, not secure context in MDN

This is the other side: features that are marked secure context in WebIDL, and not marked secure context in MDN (but do exist in MDN).

<details><summary>Click to reveal</summary>

<pre>
PasswordCredential.name
PasswordCredential.iconURL
ServiceWorker.error_event
Navigator.gpu
WorkerNavigator.gpu
GPUDevice.label
GPUBuffer.label
GPUTexture.label
GPUTextureView.label
GPUExternalTexture.label
GPUSampler.label
GPUBindGroupLayout.label
GPUBindGroup.label
GPUPipelineLayout.label
GPUShaderModule.label
GPUComputePipeline.label
GPUComputePipeline.getBindGroupLayout
GPURenderPipeline.label
GPURenderPipeline.getBindGroupLayout
GPUCommandBuffer.label
GPUCommandEncoder.label
GPUCommandEncoder.pushDebugGroup
GPUCommandEncoder.popDebugGroup
GPUCommandEncoder.insertDebugMarker
GPUComputePassEncoder.label
GPUComputePassEncoder.pushDebugGroup
GPUComputePassEncoder.popDebugGroup
GPUComputePassEncoder.insertDebugMarker
GPUComputePassEncoder.setBindGroup
GPUComputePassEncoder.setBindGroup
GPURenderPassEncoder.label
GPURenderPassEncoder.pushDebugGroup
GPURenderPassEncoder.popDebugGroup
GPURenderPassEncoder.insertDebugMarker
GPURenderPassEncoder.setBindGroup
GPURenderPassEncoder.setBindGroup
GPURenderPassEncoder.setPipeline
GPURenderPassEncoder.setIndexBuffer
GPURenderPassEncoder.setVertexBuffer
GPURenderPassEncoder.draw
GPURenderPassEncoder.drawIndexed
GPURenderPassEncoder.drawIndirect
GPURenderPassEncoder.drawIndexedIndirect
GPURenderBundle.label
GPURenderBundleEncoder.label
GPURenderBundleEncoder.pushDebugGroup
GPURenderBundleEncoder.popDebugGroup
GPURenderBundleEncoder.insertDebugMarker
GPURenderBundleEncoder.setBindGroup
GPURenderBundleEncoder.setBindGroup
GPURenderBundleEncoder.setPipeline
GPURenderBundleEncoder.setIndexBuffer
GPURenderBundleEncoder.setVertexBuffer
GPURenderBundleEncoder.draw
GPURenderBundleEncoder.drawIndexed
GPURenderBundleEncoder.drawIndirect
GPURenderBundleEncoder.drawIndexedIndirect
GPUQueue.label
GPUQuerySet.label
IdentityCredential
IdentityCredential.token
IdentityProvider
IdentityProvider.getUserInfo_static
Accelerometer
Accelerometer.Accelerometer
Accelerometer.x
Accelerometer.y
Accelerometer.z
LinearAccelerationSensor
LinearAccelerationSensor.LinearAccelerationSensor
GravitySensor
GravitySensor.GravitySensor
AmbientLightSensor
AmbientLightSensor.AmbientLightSensor
AmbientLightSensor.illuminance
XRAnchor.anchorSpace
XRAnchor.delete
XRFrame.createAnchor
XRHitTestResult.createAnchor
XRFrame.trackedAnchors
ServiceWorkerRegistration.backgroundFetch
ServiceWorkerRegistration.sync
Navigator.contacts
ServiceWorkerRegistration.index
Credential.id
Credential.type
CredentialsContainer.get
CredentialsContainer.store
CredentialsContainer.create
CredentialsContainer.preventSilentAccess
PasswordCredential.PasswordCredential
PasswordCredential.PasswordCredential
PasswordCredential.password
FederatedCredential
FederatedCredential.FederatedCredential
FederatedCredential.provider
Window.documentPictureInPicture
DocumentPictureInPicture.requestWindow
DocumentPictureInPicture.window
DocumentPictureInPicture.enter_event
DocumentPictureInPictureEvent
DocumentPictureInPictureEvent.DocumentPictureInPictureEvent
DocumentPictureInPictureEvent.window
Navigator.requestMediaKeySystemAccess
MediaKeySystemAccess
MediaKeySystemAccess.keySystem
MediaKeySystemAccess.getConfiguration
MediaKeySystemAccess.createMediaKeys
MediaKeys
MediaKeys.createSession
MediaKeys.setServerCertificate
MediaKeySession
MediaKeySession.sessionId
MediaKeySession.expiration
MediaKeySession.closed
MediaKeySession.keyStatuses
MediaKeySession.keystatuseschange_event
MediaKeySession.message_event
MediaKeySession.generateRequest
MediaKeySession.load
MediaKeySession.update
MediaKeySession.close
MediaKeySession.remove
MediaKeyStatusMap
MediaKeyStatusMap.size
MediaKeyStatusMap.has
MediaKeyStatusMap.get
MediaKeyMessageEvent
MediaKeyMessageEvent.MediaKeyMessageEvent
MediaKeyMessageEvent.messageType
MediaKeyMessageEvent.message
HTMLMediaElement.mediaKeys
HTMLMediaElement.setMediaKeys
Gamepad.hand
Gamepad.hapticActuators
Gamepad.pose
Gamepad.vibrationActuator
Gamepad.id
Gamepad.index
Gamepad.connected
Gamepad.timestamp
Gamepad.mapping
Gamepad.axes
Gamepad.buttons
GamepadButton.pressed
GamepadButton.touched
GamepadButton.value
GamepadEvent.GamepadEvent
GamepadEvent.gamepad
Sensor
Sensor.activated
Sensor.hasReading
Sensor.timestamp
Sensor.start
Sensor.stop
Sensor.reading_event
Sensor.activate_event
Sensor.error_event
SensorErrorEvent
SensorErrorEvent.SensorErrorEvent
SensorErrorEvent.error
Navigator.getInstalledRelatedApps
Gyroscope
Gyroscope.Gyroscope
Gyroscope.x
Gyroscope.y
Gyroscope.z
Worklet
Worklet.addModule
Navigator.keyboard
Window.queryLocalFonts
Magnetometer
Magnetometer.Magnetometer
Magnetometer.x
Magnetometer.y
Magnetometer.z
MediaDevices
MediaDevices.devicechange_event
MediaDevices.enumerateDevices
MediaDevices.getSupportedConstraints
Navigator.getUserMedia
ServiceWorkerRegistration.showNotification
ServiceWorkerRegistration.getNotifications
OrientationSensor
OrientationSensor.quaternion
OrientationSensor.populateMatrix
AbsoluteOrientationSensor
AbsoluteOrientationSensor.AbsoluteOrientationSensor
RelativeOrientationSensor
RelativeOrientationSensor.RelativeOrientationSensor
ServiceWorkerRegistration.paymentManager
PaymentManager
PaymentManager.userHint
PaymentManager.enableDelegations
ServiceWorkerRegistration.periodicSync
Presentation.receiver
PresentationRequest.PresentationRequest
PresentationRequest.PresentationRequest
PresentationRequest.start
PresentationRequest.reconnect
PresentationRequest.getAvailability
PresentationAvailability.value
PresentationConnectionAvailableEvent.PresentationConnectionAvailableEvent
PresentationConnectionAvailableEvent.connection
PresentationConnection.id
PresentationConnection.url
PresentationConnection.state
PresentationConnection.close
PresentationConnection.terminate
PresentationConnection.binaryType
PresentationConnection.send
PresentationConnection.send
PresentationConnection.send
PresentationConnection.send
ServiceWorkerRegistration.pushManager
PushManager
PushManager.supportedContentEncodings_static
PushManager.subscribe
PushManager.getSubscription
PushManager.permissionState
PushSubscriptionOptions
PushSubscriptionOptions.userVisibleOnly
PushSubscriptionOptions.applicationServerKey
PushSubscription
PushSubscription.endpoint
PushSubscription.expirationTime
PushSubscription.options
PushSubscription.getKey
PushSubscription.unsubscribe
PushSubscription.toJSON
PushMessageData
PushMessageData.arrayBuffer
PushMessageData.blob
PushMessageData.json
PushMessageData.text
ServiceWorkerGlobalScope.push_event
ServiceWorkerGlobalScope.pushsubscriptionchange_event
PushEvent
PushEvent.PushEvent
PushEvent.data
Element.setHTML
MediaDevices.getDisplayMedia
CaptureController
CaptureController.CaptureController
CaptureController.setFocusBehavior
Navigator.serial
WorkerNavigator.serial
ServiceWorker.scriptURL
ServiceWorker.state
ServiceWorker.statechange_event
ServiceWorkerRegistration
ServiceWorkerRegistration.installing
ServiceWorkerRegistration.waiting
ServiceWorkerRegistration.active
ServiceWorkerRegistration.navigationPreload
ServiceWorkerRegistration.scope
ServiceWorkerRegistration.updateViaCache
ServiceWorkerRegistration.update
ServiceWorkerRegistration.unregister
ServiceWorkerRegistration.updatefound_event
ServiceWorkerContainer
ServiceWorkerContainer.controller
ServiceWorkerContainer.ready
ServiceWorkerContainer.register
ServiceWorkerContainer.getRegistration
ServiceWorkerContainer.getRegistrations
ServiceWorkerContainer.startMessages
ServiceWorkerContainer.controllerchange_event
ServiceWorkerContainer.message_event
ServiceWorkerContainer.messageerror_event
NavigationPreloadManager
NavigationPreloadManager.enable
NavigationPreloadManager.disable
NavigationPreloadManager.setHeaderValue
NavigationPreloadManager.getState
Cache.match
Cache.matchAll
Cache.add
Cache.addAll
Cache.put
Cache.delete
Cache.keys
CacheStorage.match
CacheStorage.has
CacheStorage.open
CacheStorage.delete
CacheStorage.keys
Window.sharedStorage
Navigator.virtualKeyboard
BluetoothDevice
BluetoothDevice.id
BluetoothDevice.name
BluetoothDevice.gatt
BluetoothRemoteGATTServer
BluetoothRemoteGATTServer.device
BluetoothRemoteGATTServer.connected
BluetoothRemoteGATTServer.connect
BluetoothRemoteGATTServer.disconnect
BluetoothRemoteGATTServer.getPrimaryService
BluetoothRemoteGATTServer.getPrimaryServices
BluetoothRemoteGATTService
BluetoothRemoteGATTService.device
BluetoothRemoteGATTService.uuid
BluetoothRemoteGATTService.isPrimary
BluetoothRemoteGATTService.getCharacteristic
BluetoothRemoteGATTService.getCharacteristics
BluetoothRemoteGATTCharacteristic
BluetoothRemoteGATTCharacteristic.service
BluetoothRemoteGATTCharacteristic.uuid
BluetoothRemoteGATTCharacteristic.properties
BluetoothRemoteGATTCharacteristic.value
BluetoothRemoteGATTCharacteristic.getDescriptor
BluetoothRemoteGATTCharacteristic.getDescriptors
BluetoothRemoteGATTCharacteristic.readValue
BluetoothRemoteGATTCharacteristic.writeValue
BluetoothRemoteGATTCharacteristic.writeValueWithResponse
BluetoothRemoteGATTCharacteristic.writeValueWithoutResponse
BluetoothRemoteGATTCharacteristic.startNotifications
BluetoothRemoteGATTCharacteristic.stopNotifications
BluetoothRemoteGATTDescriptor
BluetoothRemoteGATTDescriptor.characteristic
BluetoothRemoteGATTDescriptor.uuid
BluetoothRemoteGATTDescriptor.value
BluetoothRemoteGATTDescriptor.readValue
BluetoothRemoteGATTDescriptor.writeValue
AudioContext.sinkId
AudioContext.setSinkId
AudioWorkletNode
AudioWorkletNode.AudioWorkletNode
AudioWorkletNode.parameters
AudioWorkletNode.port
AudioWorkletNode.processorerror_event
AudioEncoder
VideoEncoder
GPUSupportedLimits
GPUSupportedFeatures
WGSLLanguageFeatures
GPUAdapterInfo
GPUAdapterInfo.vendor
GPUAdapterInfo.architecture
GPUAdapterInfo.device
GPUAdapterInfo.description
GPU
GPU.requestAdapter
GPU.getPreferredCanvasFormat
GPU.wgslLanguageFeatures
GPUAdapter
GPUAdapter.features
GPUAdapter.limits
GPUAdapter.isFallbackAdapter
GPUAdapter.requestDevice
GPUAdapter.requestAdapterInfo
GPUDevice
GPUDevice.features
GPUDevice.limits
GPUDevice.queue
GPUDevice.destroy
GPUDevice.createBuffer
GPUDevice.createTexture
GPUDevice.createSampler
GPUDevice.importExternalTexture
GPUDevice.createBindGroupLayout
GPUDevice.createPipelineLayout
GPUDevice.createBindGroup
GPUDevice.createShaderModule
GPUDevice.createComputePipeline
GPUDevice.createRenderPipeline
GPUDevice.createComputePipelineAsync
GPUDevice.createRenderPipelineAsync
GPUDevice.createCommandEncoder
GPUDevice.createRenderBundleEncoder
GPUDevice.createQuerySet
GPUBuffer
GPUBuffer.size
GPUBuffer.usage
GPUBuffer.mapState
GPUBuffer.mapAsync
GPUBuffer.getMappedRange
GPUBuffer.unmap
GPUBuffer.destroy
GPUTexture
GPUTexture.createView
GPUTexture.destroy
GPUTexture.width
GPUTexture.height
GPUTexture.depthOrArrayLayers
GPUTexture.mipLevelCount
GPUTexture.sampleCount
GPUTexture.dimension
GPUTexture.format
GPUTexture.usage
GPUTextureView
GPUExternalTexture
GPUSampler
GPUBindGroupLayout
GPUBindGroup
GPUPipelineLayout
GPUShaderModule
GPUShaderModule.getCompilationInfo
GPUCompilationMessage
GPUCompilationMessage.message
GPUCompilationMessage.type
GPUCompilationMessage.lineNum
GPUCompilationMessage.linePos
GPUCompilationMessage.offset
GPUCompilationMessage.length
GPUCompilationInfo
GPUCompilationInfo.messages
GPUPipelineError
GPUPipelineError.GPUPipelineError
GPUPipelineError.reason
GPUComputePipeline
GPURenderPipeline
GPUCommandBuffer
GPUCommandEncoder
GPUCommandEncoder.beginRenderPass
GPUCommandEncoder.beginComputePass
GPUCommandEncoder.copyBufferToBuffer
GPUCommandEncoder.copyBufferToTexture
GPUCommandEncoder.copyTextureToBuffer
GPUCommandEncoder.copyTextureToTexture
GPUCommandEncoder.clearBuffer
GPUCommandEncoder.resolveQuerySet
GPUCommandEncoder.finish
GPUComputePassEncoder
GPUComputePassEncoder.setPipeline
GPUComputePassEncoder.dispatchWorkgroups
GPUComputePassEncoder.dispatchWorkgroupsIndirect
GPUComputePassEncoder.end
GPURenderPassEncoder
GPURenderPassEncoder.setViewport
GPURenderPassEncoder.setScissorRect
GPURenderPassEncoder.setBlendConstant
GPURenderPassEncoder.setStencilReference
GPURenderPassEncoder.beginOcclusionQuery
GPURenderPassEncoder.endOcclusionQuery
GPURenderPassEncoder.executeBundles
GPURenderPassEncoder.end
GPURenderBundle
GPURenderBundleEncoder
GPURenderBundleEncoder.finish
GPUQueue
GPUQueue.submit
GPUQueue.onSubmittedWorkDone
GPUQueue.writeBuffer
GPUQueue.writeTexture
GPUQueue.copyExternalImageToTexture
GPUQuerySet
GPUQuerySet.destroy
GPUQuerySet.type
GPUQuerySet.count
GPUCanvasContext
GPUCanvasContext.canvas
GPUCanvasContext.configure
GPUCanvasContext.unconfigure
GPUCanvasContext.getCurrentTexture
GPUDeviceLostInfo
GPUDeviceLostInfo.reason
GPUDeviceLostInfo.message
GPUDevice.lost
GPUError
GPUError.message
GPUValidationError
GPUValidationError.GPUValidationError
GPUOutOfMemoryError
GPUOutOfMemoryError.GPUOutOfMemoryError
GPUInternalError
GPUInternalError.GPUInternalError
GPUDevice.pushErrorScope
GPUDevice.popErrorScope
GPUUncapturedErrorEvent
GPUUncapturedErrorEvent.GPUUncapturedErrorEvent
GPUUncapturedErrorEvent.error
GPUDevice.uncapturederror_event
Navigator.hid
MIDIInputMap
MIDIOutputMap
WebTransportDatagramDuplexStream.readable
WebTransportDatagramDuplexStream.writable
WebTransportDatagramDuplexStream.maxDatagramSize
WebTransportDatagramDuplexStream.incomingMaxAge
WebTransportDatagramDuplexStream.outgoingMaxAge
WebTransportDatagramDuplexStream.incomingHighWaterMark
WebTransportDatagramDuplexStream.outgoingHighWaterMark
WebTransport.WebTransport
WebTransport.getStats
WebTransport.ready
WebTransport.reliability
WebTransport.congestionControl
WebTransport.closed
WebTransport.close
WebTransport.datagrams
WebTransport.createBidirectionalStream
WebTransport.incomingBidirectionalStreams
WebTransport.createUnidirectionalStream
WebTransport.incomingUnidirectionalStreams
WebTransportReceiveStream.getStats
WebTransportBidirectionalStream.readable
WebTransportBidirectionalStream.writable
WebTransportError.WebTransportError
WebTransportError.source
WebTransportError.streamErrorCode
USB.connect_event
USB.disconnect_event
Navigator.usb
WorkerNavigator.usb
USBDevice
USBDevice.usbVersionMajor
USBDevice.usbVersionMinor
USBDevice.usbVersionSubminor
USBDevice.deviceClass
USBDevice.deviceSubclass
USBDevice.deviceProtocol
USBDevice.deviceVersionMajor
USBDevice.deviceVersionMinor
USBDevice.deviceVersionSubminor
USBDevice.manufacturerName
USBDevice.productName
USBDevice.serialNumber
USBDevice.configuration
USBDevice.configurations
USBDevice.opened
USBDevice.open
USBDevice.close
USBDevice.forget
USBDevice.selectConfiguration
USBDevice.claimInterface
USBDevice.releaseInterface
USBDevice.selectAlternateInterface
USBDevice.controlTransferIn
USBDevice.controlTransferOut
USBDevice.clearHalt
USBDevice.transferIn
USBDevice.transferOut
USBDevice.isochronousTransferIn
USBDevice.isochronousTransferOut
USBDevice.reset
XRSession.environmentBlendMode
XRSession.interactionMode
XRView.isFirstPersonObserver
XRSession.depthUsage
XRSession.depthDataFormat
XRDepthInformation.width
XRDepthInformation.height
XRDepthInformation.normDepthBufferFromNormView
XRDepthInformation.rawValueToMeters
XRFrame.getDepthInformation
XRSession.domOverlayState
XRInputSource.gamepad
XRInputSource.hand
XRFrame.getJointPose
XRFrame.fillJointRadii
XRFrame.fillPoses
XRHitTestSource.cancel
XRTransientInputHitTestSource.cancel
XRHitTestResult.getPose
XRTransientInputHitTestResult.inputSource
XRTransientInputHitTestResult.results
XRSession.requestHitTestSource
XRSession.requestHitTestSourceForTransientInput
XRFrame.getHitTestResults
XRFrame.getHitTestResultsForTransientInput
XRRay.XRRay
XRRay.XRRay
XRRay.origin
XRRay.direction
XRRay.matrix
XRLightProbe.probeSpace
XRLightProbe.reflectionchange_event
XRLightEstimate.sphericalHarmonicsCoefficients
XRLightEstimate.primaryLightDirection
XRLightEstimate.primaryLightIntensity
XRSession.requestLightProbe
XRSession.preferredReflectionFormat
XRFrame.getLightEstimate
XRSystem.isSessionSupported
XRSystem.requestSession
XRSystem.devicechange_event
XRSession.visibilityState
XRSession.renderState
XRSession.inputSources
XRSession.updateRenderState
XRSession.requestReferenceSpace
XRSession.requestAnimationFrame
XRSession.cancelAnimationFrame
XRSession.end
XRSession.end_event
XRSession.inputsourceschange_event
XRSession.select_event
XRSession.selectstart_event
XRSession.selectend_event
XRSession.squeeze_event
XRSession.squeezestart_event
XRSession.squeezeend_event
XRSession.visibilitychange_event
XRRenderState.depthNear
XRRenderState.depthFar
XRRenderState.inlineVerticalFieldOfView
XRRenderState.baseLayer
XRFrame.session
XRFrame.getViewerPose
XRFrame.getPose
XRReferenceSpace.getOffsetReferenceSpace
XRReferenceSpace.reset_event
XRBoundedReferenceSpace.boundsGeometry
XRView.eye
XRView.projectionMatrix
XRView.transform
XRView.recommendedViewportScale
XRView.requestViewportScale
XRViewport.x
XRViewport.y
XRViewport.width
XRViewport.height
XRRigidTransform
XRRigidTransform.XRRigidTransform
XRRigidTransform.position
XRRigidTransform.orientation
XRRigidTransform.matrix
XRRigidTransform.inverse
XRPose.linearVelocity
XRPose.angularVelocity
XRPose.emulatedPosition
XRViewerPose
XRViewerPose.views
XRInputSource.handedness
XRInputSource.targetRayMode
XRInputSource.targetRaySpace
XRInputSource.gripSpace
XRInputSource.profiles
XRInputSourceArray.length
XRWebGLLayer.XRWebGLLayer
XRWebGLLayer.antialias
XRWebGLLayer.ignoreDepthValues
XRWebGLLayer.fixedFoveation
XRWebGLLayer.framebuffer
XRWebGLLayer.framebufferWidth
XRWebGLLayer.framebufferHeight
XRWebGLLayer.getViewport
XRWebGLLayer.getNativeFramebufferScaleFactor_static
XRSessionEvent
XRSessionEvent.XRSessionEvent
XRSessionEvent.session
XRInputSourceEvent.XRInputSourceEvent
XRInputSourceEvent.frame
XRInputSourceEvent.inputSource
XRInputSourcesChangeEvent.XRInputSourcesChangeEvent
XRInputSourcesChangeEvent.session
XRInputSourcesChangeEvent.added
XRInputSourcesChangeEvent.removed
XRReferenceSpaceEvent.XRReferenceSpaceEvent
XRReferenceSpaceEvent.referenceSpace
XRReferenceSpaceEvent.transform
XRLayerEvent.XRLayerEvent
XRLayerEvent.layer
XRRenderState.layers
ScreenDetails.screens
ScreenDetails.currentScreen
ScreenDetails.screenschange_event
ScreenDetails.currentscreenchange_event
ScreenDetailed.availLeft
ScreenDetailed.availTop
ScreenDetailed.left
ScreenDetailed.top
ScreenDetailed.isPrimary
ScreenDetailed.isInternal
ScreenDetailed.devicePixelRatio
ScreenDetailed.label
</pre>

</details>

Again I haven't looked at all of these, but I've looked at a lot, and all the ones I have seen are errors in MDN, that would be fixed by using webref/idl as a source. One common pattern is where an interface is marked secure context required, but the members are not (see for example [`ScreenDetailed`](https://developer.mozilla.org/en-US/docs/Web/API/ScreenDetailed)).

### Secure context in MDN, nonexistent in WebIDL

This lists all features that are marked secure context in MDN, and don't exist in WebIDL.

<details>

<summary>Click to reveal</summary>

<pre>

caches
MerchantValidationEvent
PaymentAddress
Element.pointerrawupdate_event
FileSystemDirectoryHandle.entries
FileSystemDirectoryHandle.keys
FileSystemDirectoryHandle.values
FileSystemHandle.remove
MerchantValidationEvent.MerchantValidationEvent
MerchantValidationEvent.methodName
MerchantValidationEvent.complete
MerchantValidationEvent.validationURL
Navigator.activeVRDisplays
PaymentAddress.addressLine
PaymentAddress.city
PaymentAddress.dependentLocality
PaymentAddress.organization
PaymentAddress.country
PaymentAddress.postalCode
PaymentAddress.region
PaymentAddress.phone
PaymentAddress.sortingCode
PaymentAddress.toJSON
PaymentAddress.recipient
PaymentRequest.merchantvalidation_event
PaymentRequest.shippingAddress
PaymentRequest.shippingaddresschange_event
PaymentRequest.shippingOption
PaymentRequest.shippingoptionchange_event
PaymentRequest.shippingType
PaymentResponse.payerdetailchange_event
PaymentResponse.payerName
PaymentResponse.payerEmail
PaymentResponse.payerPhone
PaymentResponse.shippingOption
PaymentResponse.shippingAddress
PublicKeyCredential.id
PublicKeyCredential.isConditionalMediationAvailable

</pre>

</details>

Most of these are because the feature is nonstandard. Apart from these:

- The `FileSystemDirectoryHandle` members are from the way MDN handles `iterable`.
- The `caches` member is because MDN does not handle globals properly.
- The `Element.pointerrawupdate_event` is I think an error in MDN: this event does not belong on the `Element` interface.
