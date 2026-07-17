import {useLocation, useParams} from "react-router";
import {useEffect, useState} from "react";
import {getProject} from "../../lib/puter.action";

const VisualizerId = () => {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const navState = (location.state || {}) as VisualizerLocationState;

    const [project, setProject] = useState<{
        initialImage?: string;
        initialRenderedImage?: string | null;
        name?: string | null;
    }>({
        initialImage: navState.initialImage,
        name: navState.name,
    });

    const [loading, setLoading] = useState(!navState.initialImage);

    useEffect(() => {
        if (navState.initialImage || !id) return;

        let cancelled = false;
        setLoading(true);

        getProject(id).then((saved) => {
            if (cancelled) return;
            if (saved) {
                setProject({
                    initialImage: saved.sourceImage,
                    initialRenderedImage: saved.renderedImage,
                    name: saved.name,
                });
            }
            setLoading(false);
        });

        return () => { cancelled = true; };
    }, [id, navState.initialImage]);

    if (loading) {
        return <section><p>Loading project…</p></section>;
    }

    return (
        <section>
            <h1> { project.name || 'Untitled Project '}</h1>

            <div className="visualizer">
                { project.initialImage && (
                    <div className="image-container">
                        <h2>Source Image</h2>
                        <img src={project.initialImage} alt="source" />
                    </div>
                )}
            </div>
        </section>
    )
}
export default VisualizerId
