'use client';

import { motion } from 'framer-motion';

const Loader = () => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
        >
            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                    delay: 0.2,
                    duration: 0.5,
                    ease: 'easeOut',
                }}
                className="relative w-24 h-24"
            >
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'linear',
                    }}
                    className="absolute inset-0 border-4 border-transparent border-t-red-500 rounded-full"
                />
                <motion.div
                    animate={{ rotate: -360 }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'linear',
                    }}
                    className="absolute inset-2 border-4 border-transparent border-t-blue-500 rounded-full"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">A</span>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default Loader;
