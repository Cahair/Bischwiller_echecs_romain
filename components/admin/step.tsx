import type { ReactNode } from "react";
import { Icon } from "./icons";
import styles from "./admin.module.css";

/**
 * Une étape numérotée de l’espace admin : même forme pour écrire un article et
 * pour composer la une, afin qu’il n’y ait qu’une façon de remplir un
 * formulaire à apprendre.
 */
export function Step({
  number,
  title,
  hint,
  need,
  done = false,
  error = null,
  children,
}: {
  number: number;
  title: string;
  hint?: ReactNode;
  /** Dit en toutes lettres à côté du titre : on sait d’emblée ce qu’on peut laisser de côté. */
  need: "required" | "optional";
  done?: boolean;
  /** Étape obligatoire restée vide au moment d’enregistrer. */
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <section
      id={`etape-${number}-bloc`}
      className={`${styles.step} ${error ? styles.stepError : ""}`}
      aria-labelledby={`etape-${number}`}
    >
      <div className={styles.stepHead}>
        {/* Le numéro devient une coche une fois l’étape remplie : on voit où l’on en est. */}
        <span className={`${styles.stepNum} ${done ? styles.stepNumDone : ""}`} aria-hidden="true">
          {done ? <Icon name="check" /> : number}
        </span>
        <div>
          <h2 className={styles.stepTitle} id={`etape-${number}`}>
            {title}{" "}
            {need === "required" ? (
              <span className={styles.required}>obligatoire</span>
            ) : (
              <span className={styles.optional}>facultatif</span>
            )}
          </h2>
          {hint ? <p className={styles.stepHint}>{hint}</p> : null}
        </div>
      </div>
      <div className={styles.stepBody}>
        {error ? (
          <p className={styles.stepErrorText} id={`etape-${number}-erreur`}>
            <Icon name="alert" /> {error}
          </p>
        ) : null}
        {children}
      </div>
    </section>
  );
}
