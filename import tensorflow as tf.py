import tensorflow as tf

# Create a constant tensor
hello = tf.constant('Hello, World!')

# Start a TensorFlow session
with tf.Session() as sess:
    # Run the tensor and print the result
    print(sess.run(hello))